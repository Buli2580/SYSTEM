using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace SystemWorld.RealWorld {
public sealed class RealWorldBundle {
 public const string DemoFormat = "SYSTEM_CITY_MULTITILE_DEMO_V1";
 static readonly string[] LodOrder = { "HIGH", "MEDIUM", "LOW", "DISTANT" };
 static readonly Regex SafeFileRe = new Regex(@"^[A-Za-z0-9_./-]+$", RegexOptions.Compiled);

 public string Root { get; private set; }
 public string DataStatus { get; private set; }
 public bool ActualLeborkData { get; private set; }
 public string[] TileIds { get; private set; }
 public RealWorldGeo Origin { get; private set; }
 public Dictionary<string, RealWorldTransform> TileTransforms { get; private set; }
 public Dictionary<string, PacketRow> Packets { get; private set; }
 public int UniqueFeatures { get; private set; }
 public Dictionary<string, int> Counts { get; private set; }

 public sealed class PacketRow {
  public string file, lod, tileId, datasetId, sha256;
  public int bytes, features, meshes, triangles;
 }

 public static string ResolveDefaultRoot() {
  return RealWorldStreamingUtil.EnsureReadableRoot();
 }

 public static RealWorldBundle Load(string root = null) {
  root = Path.GetFullPath(root ?? ResolveDefaultRoot());
  var manifestPath = Path.Combine(root, "manifest.json");
  var manifestBytes = File.ReadAllBytes(manifestPath);
  if (manifestBytes.Length > 2_000_000) throw new FormatException("CITY_MANIFEST_LIMIT");
  var raw = Encoding.UTF8.GetString(manifestBytes);
  StrictJson.Validate(raw);
  var manifest = JObject.Parse(raw);
  if ((string)manifest["format"] != DemoFormat) throw new FormatException("CITY_MANIFEST");
  if ((string)manifest["protocolVersion"] != RealWorldValidator.Protocol) throw new FormatException("CITY_MANIFEST");
  if ((string)manifest["dataStatus"] != "SYNTHETIC") throw new FormatException("CITY_MANIFEST");
  var tileIdsTok = manifest["tileIds"] as JArray;
  var packetsTok = manifest["packets"] as JArray;
  var filesTok = manifest["files"] as JArray;
  if (tileIdsTok == null || packetsTok == null || filesTok == null) throw new FormatException("CITY_MANIFEST");
  if (tileIdsTok.Count < 9 || tileIdsTok.Count > 64 || packetsTok.Count != tileIdsTok.Count * 4 || filesTok.Count != 3) throw new FormatException("CITY_MANIFEST");
  var tileIds = tileIdsTok.Select(t => (string)t).ToArray();
  if (tileIds.Distinct().Count() != tileIds.Length) throw new FormatException("CITY_MANIFEST");
  foreach (var id in tileIds) RealWorldSector.Parse(id, out _, out _);
  var originTok = (JObject)manifest["origin"];
  var origin = new RealWorldGeo {
   latitude = originTok["latitude"].Value<double>(),
   longitude = originTok["longitude"].Value<double>(),
   altitude = originTok["altitude"].Value<double>()
  };
  RealWorldValidator.AssertGeo(origin);
  var transforms = new Dictionary<string, RealWorldTransform>();
  var transformsTok = (JObject)manifest["tileTransforms"];
  foreach (var id in tileIds) {
   if (transformsTok[id] is not JObject t) throw new FormatException("CITY_TRANSFORM");
   transforms[id] = ReadTransform(t);
  }
  var names = new HashSet<string>();
  var combos = new HashSet<string>();
  long total = 0;
  var packetRows = new Dictionary<string, PacketRow>();
  void CheckRow(JObject row, bool isPacket) {
   var file = (string)row["file"];
   if (string.IsNullOrEmpty(file) || !SafeFileRe.IsMatch(file) || file.Split('/').Contains("..") || Path.IsPathRooted(file) || !names.Add(file))
    throw new FormatException("CITY_ROW");
   var bytes = row["bytes"].Value<int>();
   var sha = (string)row["sha256"];
   if (bytes < 1 || bytes > (isPacket ? 4_000_001 : 2_000_000) || sha == null || !Regex.IsMatch(sha, "^[a-f0-9]{64}$"))
    throw new FormatException("CITY_ROW_LIMIT");
   total += bytes;
   if (total > 32_000_000) throw new FormatException("CITY_BUNDLE_BUDGET");
   if (!isPacket) return;
   var lod = (string)row["lod"];
   var tileId = (string)row["tileId"];
   var datasetId = (string)row["datasetId"];
   if (!tileIds.Contains(tileId) || Array.IndexOf(LodOrder, lod) < 0 || string.IsNullOrEmpty(datasetId) || !combos.Add(lod + ":" + tileId))
    throw new FormatException("CITY_ROW");
   packetRows[lod + ":" + tileId] = new PacketRow {
    file = file, bytes = bytes, sha256 = sha, lod = lod, tileId = tileId, datasetId = datasetId,
    features = row["features"]?.Value<int>() ?? 0,
    meshes = row["meshes"]?.Value<int>() ?? 0,
    triangles = row["triangles"]?.Value<int>() ?? 0
   };
  }
  foreach (JObject row in packetsTok) CheckRow(row, true);
  foreach (JObject row in filesTok) CheckRow(row, false);
  foreach (var name in new[] { "source.osm", "source-preview.svg", ".gitattributes" })
   if (!filesTok.Any(f => (string)f["file"] == name)) throw new FormatException("CITY_SOURCE_MISSING");

  var realRoot = Path.GetFullPath(root);
  foreach (var row in packetsTok.Concat(filesTok).Cast<JObject>()) {
   var rel = (string)row["file"];
   var path = Path.GetFullPath(Path.Combine(root, rel.Replace('/', Path.DirectorySeparatorChar)));
   if (!path.StartsWith(realRoot, StringComparison.OrdinalIgnoreCase)) throw new FormatException("CITY_PATH");
   var info = new FileInfo(path);
   if (!info.Exists || info.Length != row["bytes"].Value<long>()) throw new FormatException("CITY_HASH");
   var bytes = File.ReadAllBytes(path);
   if (!Sha256Hex(bytes).Equals((string)row["sha256"], StringComparison.Ordinal)) throw new FormatException("CITY_HASH");
  }

  var counts = new Dictionary<string, int>();
  var countsObj = manifest["counts"] as JObject ?? new JObject();
  foreach (var p in countsObj.Properties()) counts[p.Name] = p.Value.Value<int>();

  return new RealWorldBundle {
   Root = root,
   DataStatus = "SYNTHETIC",
   ActualLeborkData = manifest["actualLeborkData"]?.Value<bool>() ?? true,
   TileIds = tileIds,
   Origin = origin,
   TileTransforms = transforms,
   Packets = packetRows,
   UniqueFeatures = manifest["uniqueFeatures"]?.Value<int>() ?? 0,
   Counts = counts
  };
 }

 public RealWorldPacket LoadPacket(string tileId, string lod, bool validateV1 = true) {
  if (!Packets.TryGetValue(lod + ":" + tileId, out var row)) throw new FileNotFoundException("PACKET_MISSING:" + lod + ":" + tileId);
  var path = Path.Combine(Root, row.file.Replace('/', Path.DirectorySeparatorChar));
  var bytes = File.ReadAllBytes(path);
  if (bytes.Length != row.bytes || Sha256Hex(bytes) != row.sha256) throw new FormatException("CITY_HASH");
  var raw = Encoding.UTF8.GetString(bytes);
  if (!validateV1) throw new InvalidOperationException("validateV1 required");
  var packet = RealWorldValidator.ValidatePacketJson(raw);
  if (packet.tile.tileId != row.tileId || packet.tile.datasetId != row.datasetId || packet.tile.provenance.kind != "FIXTURE")
   throw new FormatException("CITY_PACKET");
  if (packet.meshes.Any(m => m.lod != row.lod)) throw new FormatException("CITY_PACKET");
  return packet;
 }

 public IEnumerable<RealWorldPacket> LoadLod(string lod) {
  foreach (var id in TileIds) yield return LoadPacket(id, lod);
 }

 static RealWorldTransform ReadTransform(JObject t) {
  RealWorldVec3 V(string name) {
   var o = (JObject)t[name];
   return new RealWorldVec3(o["x"].Value<double>(), o["y"].Value<double>(), o["z"].Value<double>());
  }
  return new RealWorldTransform { translation = V("translation"), x = V("x"), y = V("y"), z = V("z") };
 }

 public static string Sha256Hex(byte[] bytes) {
  using var sha = SHA256.Create();
  var hash = sha.ComputeHash(bytes);
  var sb = new StringBuilder(hash.Length * 2);
  foreach (var b in hash) sb.Append(b.ToString("x2"));
  return sb.ToString();
 }
}
}
