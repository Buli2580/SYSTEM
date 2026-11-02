using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace SystemWorld.RealWorld {
public static class RealWorldValidator {
 public const string Protocol = "SYSTEM_REAL_WORLD_DATA_V1";
 public const int MaxPacketUtf8 = 4_000_000;
 public const int MaxTileUtf8 = 2_000_000;
 static readonly Regex DatasetRe = new Regex(@"^[A-Za-z0-9_.:-]{1,96}$", RegexOptions.Compiled);
 static readonly Regex FeatureIdRe = new Regex(@"^osm:(?:node|way):-?[1-9][0-9]{0,19}$", RegexOptions.Compiled);
 static readonly Regex NodeIdRe = new Regex(@"^-?[1-9][0-9]{0,19}$", RegexOptions.Compiled);
 static readonly HashSet<string> FeatureKinds = new HashSet<string> { "ROAD", "BUILDING", "PARK", "PLAZA", "GREEN", "WATER", "POI" };
 static readonly HashSet<string> Lods = new HashSet<string> { "HIGH", "MEDIUM", "LOW", "DISTANT" };
 static readonly HashSet<string> FacadeStyles = new HashSet<string> { "WINDOW_GRID", "FLOOR_BANDS", "PLAIN" };

 public static int Utf8Bytes(string raw) => Encoding.UTF8.GetByteCount(raw ?? "");

 static void Fail(string code) => throw new FormatException(code);

 static void OnlyKeys(JObject obj, params string[] allowed) {
  if (obj == null) Fail("WORLD_UNEXPECTED_FIELD");
  var set = new HashSet<string>(allowed);
  foreach (var p in obj.Properties()) if (!set.Contains(p.Name)) Fail("WORLD_UNEXPECTED_FIELD");
 }

 static bool Finite(double v) => !(double.IsNaN(v) || double.IsInfinity(v));
 static double Num(JToken t) {
  if (t == null || t.Type != JTokenType.Float && t.Type != JTokenType.Integer) Fail("WORLD_NUMBER");
  return t.Value<double>();
 }
 static int IntExact(JToken t) {
  var v = Num(t);
  if (Math.Abs(v - Math.Round(v)) > 1e-9 || v < int.MinValue || v > int.MaxValue) Fail("WORLD_INTEGER");
  return (int)Math.Round(v);
 }
 static string Str(JToken t) {
  if (t == null || t.Type != JTokenType.String) Fail("WORLD_STRING");
  return t.Value<string>();
 }

 public static void AssertGeo(RealWorldGeo p) {
  if (!Finite(p.latitude) || Math.Abs(p.latitude) > 90 || !Finite(p.longitude) || Math.Abs(p.longitude) > 180 || !Finite(p.altitude) || Math.Abs(p.altitude) > 1_000_000)
   Fail("GEO_INVALID");
 }

 public static RealWorldPacket ValidatePacketJson(string raw) {
  if (string.IsNullOrEmpty(raw)) Fail("WORLD_PACKET");
  if (Utf8Bytes(raw) > MaxPacketUtf8) Fail("WORLD_PACKET_LIMIT");
  StrictJson.Validate(raw);
  var root = JObject.Parse(raw);
  OnlyKeys(root, "protocolVersion", "tile", "meshes", "meshDiagnostics");
  if (Str(root["protocolVersion"]) != Protocol) Fail("WORLD_PACKET");
  var meshesTok = root["meshes"] as JArray;
  var diagTok = root["meshDiagnostics"] as JArray;
  if (meshesTok == null || diagTok == null) Fail("WORLD_PACKET");
  var tile = ValidateTile(root["tile"] as JObject);
  if (meshesTok.Count > tile.features.Length || diagTok.Count > tile.features.Length) Fail("WORLD_PACKET_LIMIT");
  var ids = new HashSet<string>();
  foreach (var f in tile.features) ids.Add(f.id);
  var seen = new HashSet<string>();
  var meshes = new List<RealWorldMesh>();
  foreach (var meshItem in meshesTok) {
   var mesh = ValidateMesh(meshItem as JObject, ids, seen, tile);
   meshes.Add(mesh);
  }
  var diags = new List<RealWorldMeshDiagnostic>();
  foreach (var diagItem in diagTok) {
   var dTok = diagItem as JObject;
   if (dTok == null) Fail("WORLD_DIAGNOSTIC");
   OnlyKeys(dTok, "id", "code");
   var id = Str(dTok["id"]);
   var code = Str(dTok["code"]);
   if (!ids.Contains(id) || code.Length > 80 || seen.Contains(id)) Fail("WORLD_DIAGNOSTIC");
   seen.Add(id);
   diags.Add(new RealWorldMeshDiagnostic { id = id, code = code });
  }
  if (seen.Count != ids.Count) Fail("WORLD_MESH_ACCOUNTING");
  return new RealWorldPacket {
   protocolVersion = Protocol,
   tile = tile,
   meshes = meshes.ToArray(),
   meshDiagnostics = diags.ToArray(),
   rawJson = raw,
   utf8Bytes = Utf8Bytes(raw)
  };
 }

 static RealWorldTile ValidateTile(JObject t) {
  if (t == null) Fail("WORLD_TILE_INVALID");
  OnlyKeys(t, "version", "datasetId", "tileId", "origin", "provenance", "attribution", "features");
  if (IntExact(t["version"]) != 1) Fail("WORLD_TILE_INVALID");
  var datasetId = Str(t["datasetId"]);
  if (!DatasetRe.IsMatch(datasetId)) Fail("WORLD_TILE_INVALID");
  var tileId = Str(t["tileId"]);
  if (string.IsNullOrEmpty(tileId)) Fail("WORLD_TILE_INVALID");
  var provenanceTok = (JObject)t["provenance"];
  OnlyKeys(provenanceTok, "kind", "datasetId", "sourceUrl", "retrievedAt");
  var provenance = new RealWorldProvenance {
   kind = Str(provenanceTok["kind"]),
   datasetId = Str(provenanceTok["datasetId"]),
   sourceUrl = provenanceTok["sourceUrl"]?.Type == JTokenType.String ? provenanceTok["sourceUrl"].Value<string>() : null,
   retrievedAt = provenanceTok["retrievedAt"]?.Type == JTokenType.String ? provenanceTok["retrievedAt"].Value<string>() : null
  };
  if (provenance.datasetId != datasetId || (provenance.kind != "OSM" && provenance.kind != "FIXTURE")) Fail("WORLD_TILE_INVALID");
  if (provenance.kind == "OSM") {
   if (string.IsNullOrEmpty(provenance.sourceUrl) || !provenance.sourceUrl.StartsWith("https://", StringComparison.Ordinal)) Fail("WORLD_PROVENANCE");
   if (string.IsNullOrEmpty(provenance.retrievedAt) || !DateTime.TryParse(provenance.retrievedAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _)) Fail("WORLD_PROVENANCE");
  }
  var attribution = Str(t["attribution"]);
  if (attribution.Length < 5 || attribution.Length > 200) Fail("WORLD_TILE_INVALID");
  var featuresTok = t["features"] as JArray;
  if (featuresTok == null || featuresTok.Count > 2000) Fail("WORLD_TILE_INVALID");
  var originTok = t["origin"] as JObject;
  if (originTok == null) Fail("WORLD_TILE_INVALID");
  OnlyKeys(originTok, "latitude", "longitude", "altitude");
  var origin = new RealWorldGeo { latitude = Num(originTok["latitude"]), longitude = Num(originTok["longitude"]), altitude = Num(originTok["altitude"]) };
  AssertGeo(origin);
  RealWorldSector.Bounds(tileId, out var west, out var south, out var east, out var north);
  if (Math.Abs(origin.latitude - (south + north) / 2) > 1e-9 || Math.Abs(origin.longitude - (west + east) / 2) > 1e-9 || origin.altitude != 0) Fail("WORLD_TILE_ORIGIN");
  var features = new List<RealWorldFeature>();
  var ids = new HashSet<string>();
  var pointCount = 0;
  foreach (var featureItem in featuresTok) {
   var fTok = featureItem as JObject;
   if (fTok == null) Fail("WORLD_FEATURE_INVALID");
   OnlyKeys(fTok, "id", "kind", "nodeIds", "points", "tags");
   var id = Str(fTok["id"]);
   var kind = Str(fTok["kind"]);
   if (!FeatureIdRe.IsMatch(id) || ids.Contains(id) || !FeatureKinds.Contains(kind)) Fail("WORLD_FEATURE_INVALID");
   var pointsTok = fTok["points"] as JArray;
   var nodeIdsTok = fTok["nodeIds"] as JArray;
   var tagsTok = fTok["tags"] as JObject;
   if (pointsTok == null || pointsTok.Count < 1 || pointsTok.Count > 2000) Fail("WORLD_FEATURE_INVALID");
   if (nodeIdsTok == null || nodeIdsTok.Count != pointsTok.Count) Fail("WORLD_FEATURE_INVALID");
   if (tagsTok == null) Fail("WORLD_FEATURE_INVALID");
   var tags = new Dictionary<string, string>();
   foreach (var p in tagsTok.Properties()) {
    if (p.Name.Length > 80 || p.Value.Type != JTokenType.String || p.Value.Value<string>().Length > 512) Fail("WORLD_TAGS_INVALID");
    tags[p.Name] = p.Value.Value<string>();
   }
   if (tags.Count > 40) Fail("WORLD_TAGS_INVALID");
   var nodeIds = new string[nodeIdsTok.Count];
   for (var i = 0; i < nodeIdsTok.Count; i++) {
    nodeIds[i] = Str(nodeIdsTok[i]);
    if (!NodeIdRe.IsMatch(nodeIds[i])) Fail("WORLD_TAGS_INVALID");
   }
   var points = new RealWorldVec3[pointsTok.Count];
   for (var i = 0; i < pointsTok.Count; i++) {
    var pt = pointsTok[i] as JObject;
    if (pt == null) Fail("WORLD_GEOMETRY_INVALID");
    OnlyKeys(pt, "x", "y", "z");
    points[i] = new RealWorldVec3(Num(pt["x"]), Num(pt["y"]), Num(pt["z"]));
    if (!Finite(points[i].x) || !Finite(points[i].y) || !Finite(points[i].z)) Fail("WORLD_GEOMETRY_INVALID");
    if (Math.Sqrt(points[i].x * points[i].x + points[i].y * points[i].y + points[i].z * points[i].z) > 30000) Fail("WORLD_GEOMETRY_INVALID");
   }
   if (kind == "ROAD" && points.Length < 2) Fail("WORLD_GEOMETRY_INVALID");
   if (kind != "ROAD" && kind != "POI") {
    if (points.Length < 4) Fail("WORLD_GEOMETRY_INVALID");
    var dx = points[0].x - points[points.Length - 1].x;
    var dz = points[0].z - points[points.Length - 1].z;
    if (Math.Sqrt(dx * dx + dz * dz) > 0.001) Fail("WORLD_GEOMETRY_INVALID");
   }
   ids.Add(id);
   pointCount += points.Length;
   features.Add(new RealWorldFeature { id = id, kind = kind, nodeIds = nodeIds, points = points, tags = tags });
  }
  if (pointCount > 20000) Fail("WORLD_TILE_LIMIT");
  return new RealWorldTile {
   version = 1,
   datasetId = datasetId,
   tileId = tileId,
   origin = origin,
   provenance = provenance,
   attribution = attribution,
   features = features.ToArray()
  };
 }

 static RealWorldMesh ValidateMesh(JObject mesh, HashSet<string> ids, HashSet<string> seen, RealWorldTile tile) {
  var facadeTok = mesh == null ? null : mesh["facade"] as JObject;
  if (mesh == null || facadeTok == null) Fail("WORLD_MESH_METADATA");
  OnlyKeys(facadeTok, "style", "floors");
  OnlyKeys(mesh, "id", "lod", "positions", "indices", "normals", "height", "heightSource", "geometryQuality", "roofModel", "requestedRoof", "buildingClass", "orientationDegrees", "facade");
  var style = Str(facadeTok["style"]);
  var floors = IntExact(facadeTok["floors"]);
  if (!FacadeStyles.Contains(style) || floors < 0 || floors > 334) Fail("WORLD_MESH_METADATA");
  var orientation = Num(mesh["orientationDegrees"]);
  if (!Finite(orientation) || Math.Abs(orientation) > 180) Fail("WORLD_MESH_METADATA");
  string ReqStr(string key) {
   var s = Str(mesh[key]);
   if (s.Length > 512) Fail("WORLD_MESH_METADATA");
   return s;
  }
  var heightSource = ReqStr("heightSource");
  var roofModel = ReqStr("roofModel");
  var requestedRoof = ReqStr("requestedRoof");
  var buildingClass = ReqStr("buildingClass");
  var id = Str(mesh["id"]);
  var lod = Str(mesh["lod"]);
  if (!ids.Contains(id) || seen.Contains(id) || !Lods.Contains(lod)) Fail("WORLD_MESH_INVALID");
  var posTok = mesh["positions"] as JArray;
  var nrmTok = mesh["normals"] as JArray;
  var idxTok = mesh["indices"] as JArray;
  if (posTok == null || posTok.Count > 100000 || posTok.Count % 3 != 0) Fail("WORLD_MESH_INVALID");
  if (nrmTok == null || nrmTok.Count != posTok.Count) Fail("WORLD_MESH_INVALID");
  if (idxTok == null || idxTok.Count > 100000 || idxTok.Count % 3 != 0) Fail("WORLD_MESH_INVALID");
  var feature = Array.Find(tile.features, f => f.id == id);
  if (feature != null && feature.kind != "POI" && (posTok.Count < 9 || idxTok.Count < 3)) Fail("WORLD_MESH_EMPTY");
  var positions = new double[posTok.Count];
  for (var i = 0; i < posTok.Count; i++) {
   positions[i] = Num(posTok[i]);
   if (!Finite(positions[i]) || Math.Abs(positions[i]) > 100000) Fail("WORLD_MESH_INVALID");
  }
  var normals = new double[nrmTok.Count];
  for (var i = 0; i < nrmTok.Count; i++) {
   normals[i] = Num(nrmTok[i]);
   if (!Finite(normals[i]) || Math.Abs(normals[i]) > 1.00001) Fail("WORLD_MESH_INVALID");
  }
  var vertCount = positions.Length / 3;
  var indices = new int[idxTok.Count];
  for (var i = 0; i < idxTok.Count; i++) {
   indices[i] = IntExact(idxTok[i]);
   if (indices[i] < 0 || indices[i] >= vertCount) Fail("WORLD_MESH_INVALID");
  }
  var height = Num(mesh["height"]);
  if (!Finite(height) || height < 0 || height > 1000) Fail("WORLD_MESH_INVALID");
  if (Str(mesh["geometryQuality"]) != "PROCEDURAL_APPROXIMATION") Fail("WORLD_MESH_INVALID");
  seen.Add(id);
  return new RealWorldMesh {
   id = id,
   lod = lod,
   positions = positions,
   indices = indices,
   normals = normals,
   height = height,
   heightSource = heightSource,
   geometryQuality = "PROCEDURAL_APPROXIMATION",
   roofModel = roofModel,
   requestedRoof = requestedRoof,
   buildingClass = buildingClass,
   orientationDegrees = orientation,
   facade = new RealWorldFacade { style = style, floors = floors }
  };
 }
}
}
