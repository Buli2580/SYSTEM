using System;
using System.Collections.Generic;
using System.Linq;

namespace SystemWorld.RealWorld {
public sealed class RealWorldMultitileSession : IDisposable {
 public const int DefaultMaxTiles = 9;
 public const int DefaultMaxPacketBytes = 4_000_000;
 public const int DefaultMaxMeshBytes = 4_000_000;
 public const int DefaultMaxObjects = 100;

 readonly RealWorldBundle bundle;
 readonly int maxTiles, maxPacketBytes, maxMeshBytes, maxObjects;
 readonly Dictionary<string, RealWorldPacket> packets = new Dictionary<string, RealWorldPacket>();
 string activeLod;
 string datasetId;
 bool disposed;

 public RealWorldMultitileSession(RealWorldBundle bundle, int maxTiles = DefaultMaxTiles, int maxPacketBytes = DefaultMaxPacketBytes, int maxMeshBytes = DefaultMaxMeshBytes, int maxObjects = DefaultMaxObjects) {
  this.bundle = bundle ?? throw new ArgumentNullException(nameof(bundle));
  if (maxTiles < 1 || maxTiles > 9) throw new ArgumentOutOfRangeException(nameof(maxTiles));
  this.maxTiles = maxTiles;
  this.maxPacketBytes = maxPacketBytes;
  this.maxMeshBytes = maxMeshBytes;
  this.maxObjects = maxObjects;
 }

 public string ActiveLod => activeLod;
 public int ResidentTileCount => packets.Count;
 public bool IsDisposed => disposed;

 public static int MeshByteCost(RealWorldPacket p) {
  var n = 0;
  foreach (var m in p.meshes) n += 8 * (m.positions.Length + m.normals.Length + m.indices.Length);
  return n;
 }

 public RealWorldSnapshot LoadLod(string lod) {
  EnsureAlive();
  if (lod != "HIGH" && lod != "MEDIUM" && lod != "LOW" && lod != "DISTANT") throw new FormatException("RENDER_LOD");
  ClearResidents();
  activeLod = lod;
  datasetId = null;
  var errors = new List<string>();
  var loaded = 0;
  foreach (var tileId in bundle.TileIds) {
   if (loaded >= maxTiles) break;
   try {
    var packet = bundle.LoadPacket(tileId, lod);
    Admit(packet);
    packets[tileId] = packet;
    datasetId = packet.tile.datasetId;
    loaded++;
   } catch (Exception ex) {
    errors.Add(tileId + ":" + ex.Message);
   }
  }
  return Snapshot(errors);
 }

 public RealWorldSnapshot Snapshot(IEnumerable<string> extraErrors = null) {
  EnsureAlive();
  var entries = packets.OrderBy(kv => kv.Key, StringComparer.Ordinal).ToList();
  var meshes = new List<RealWorldMeshView>();
  var seen = new HashSet<string>();
  var triangles = 0;
  foreach (var (tileId, packet) in entries) {
   if (!bundle.TileTransforms.TryGetValue(tileId, out var transform)) throw new FormatException("CITY_TRANSFORM");
   var kinds = packet.tile.features.ToDictionary(f => f.id, f => f.kind);
   foreach (var mesh in packet.meshes) {
    if (!seen.Add(mesh.id)) continue;
    kinds.TryGetValue(mesh.id, out var kind);
    meshes.Add(new RealWorldMeshView { mesh = mesh, tileId = tileId, transform = transform, kind = kind ?? "UNKNOWN" });
    triangles += mesh.indices.Length / 3;
   }
  }
  var packetBytes = packets.Values.Sum(p => p.utf8Bytes);
  var meshBytes = packets.Values.Sum(MeshByteCost);
  var errors = extraErrors?.ToArray() ?? Array.Empty<string>();
  return new RealWorldSnapshot {
   activeTiles = entries.Select(e => e.Key).ToArray(),
   lod = activeLod,
   meshes = meshes.ToArray(),
   packetBytes = packetBytes,
   meshBytes = meshBytes,
   errors = errors,
   uniqueMeshCount = meshes.Count,
   triangleCount = triangles
  };
 }

 public void Dispose() {
  disposed = true;
  ClearResidents();
  activeLod = null;
  datasetId = null;
 }

 void Admit(RealWorldPacket packet) {
  if (packet.meshes.Any(m => m.lod != activeLod)) throw new FormatException("RENDER_LOD_MISMATCH");
  if (datasetId != null && packet.tile.datasetId != datasetId) throw new FormatException("WORLD_DATASET_MISMATCH");
  if (packet.tile.features.Length > maxObjects) throw new FormatException("RENDER_OBJECT_BUDGET");
  var next = packets.Values.Append(packet).ToList();
  if (next.Sum(p => p.utf8Bytes) > maxPacketBytes) throw new FormatException("RENDER_PACKET_BUDGET");
  if (next.Sum(MeshByteCost) > maxMeshBytes) throw new FormatException("RENDER_PACKET_BUDGET");
 }

 void ClearResidents() {
  packets.Clear();
 }

 void EnsureAlive() {
  if (disposed) throw new ObjectDisposedException(nameof(RealWorldMultitileSession));
 }
}
}
