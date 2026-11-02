using System;
using System.IO;
using System.Linq;
using System.Text;
using NUnit.Framework;
using SystemWorld.RealWorld;

public class RealWorldValidatorTests {
 static string Root => RealWorldBundle.ResolveDefaultRoot();

 [Test]
 public void BundleManifestAndAll36PacketsValidate() {
  var bundle = RealWorldBundle.Load(Root);
  Assert.AreEqual("SYNTHETIC", bundle.DataStatus);
  Assert.False(bundle.ActualLeborkData);
  Assert.AreEqual(9, bundle.TileIds.Length);
  Assert.AreEqual(36, bundle.Packets.Count);
  Assert.AreEqual(14, bundle.UniqueFeatures);
  var n = 0;
  foreach (var lod in new[] { "LOW", "MEDIUM", "HIGH", "DISTANT" })
   foreach (var id in bundle.TileIds) {
    var packet = bundle.LoadPacket(id, lod);
    Assert.AreEqual(RealWorldValidator.Protocol, packet.protocolVersion);
    Assert.AreEqual(id, packet.tile.tileId);
    Assert.AreEqual("FIXTURE", packet.tile.provenance.kind);
    Assert.True(packet.meshes.All(m => m.lod == lod));
    n++;
   }
  Assert.AreEqual(36, n);
 }

 [Test]
 public void ShaMismatchRejected() {
  var bundle = RealWorldBundle.Load(Root);
  var row = bundle.Packets["LOW:" + bundle.TileIds[0]];
  var path = Path.Combine(bundle.Root, row.file.Replace('/', Path.DirectorySeparatorChar));
  var original = File.ReadAllBytes(path);
  try {
   var corrupt = (byte[])original.Clone();
   corrupt[0] ^= 0xff;
   File.WriteAllBytes(path, corrupt);
   Assert.Throws<FormatException>(() => bundle.LoadPacket(bundle.TileIds[0], "LOW"));
  } finally {
   File.WriteAllBytes(path, original);
  }
 }

 [Test]
 public void BlankTileIdRejected() {
  var sample = File.ReadAllText(Path.Combine(Root, "LOW", "18-143997-83496.json"));
  var bad = sample.Replace("\"tileId\":\"18/143997/83496\"", "\"tileId\":\"\"");
  Assert.Throws<FormatException>(() => RealWorldValidator.ValidatePacketJson(bad));
 }

 [Test]
 public void WrongProtocolRejected() {
  var sample = File.ReadAllText(Path.Combine(Root, "LOW", "18-143997-83496.json"));
  var bad = sample.Replace(RealWorldValidator.Protocol, "SYSTEM_REAL_WORLD_DATA_V2");
  Assert.Throws<FormatException>(() => RealWorldValidator.ValidatePacketJson(bad));
 }

 [Test]
 public void BadOriginRejected() {
  var sample = File.ReadAllText(Path.Combine(Root, "LOW", "18-143997-83496.json"));
  var bad = sample.Replace("\"altitude\":0", "\"altitude\":12");
  Assert.Throws<FormatException>(() => RealWorldValidator.ValidatePacketJson(bad));
 }

 [Test]
 public void ExtraFieldRejected() {
  var sample = File.ReadAllText(Path.Combine(Root, "LOW", "18-143997-83496.json"));
  var bad = sample.Replace("\"meshDiagnostics\":[]", "\"meshDiagnostics\":[],\"extra\":1");
  Assert.Throws<FormatException>(() => RealWorldValidator.ValidatePacketJson(bad));
 }

 [Test]
 public void OversizedPacketRejected() {
  var huge = new string('x', RealWorldValidator.MaxPacketUtf8 + 8);
  Assert.Throws<FormatException>(() => RealWorldValidator.ValidatePacketJson("{\"protocolVersion\":\"SYSTEM_REAL_WORLD_DATA_V1\",\"tile\":{},\"meshes\":[],\"meshDiagnostics\":[],\"pad\":\"" + huge + "\"}"));
 }

 [Test]
 public void MissingPacketFileRejected() {
  var bundle = RealWorldBundle.Load(Root);
  Assert.Throws<FileNotFoundException>(() => bundle.LoadPacket(bundle.TileIds[0], "NOPE"));
 }

 [Test]
 public void LowLodSessionDedupesToUniqueFeatures() {
  var bundle = RealWorldBundle.Load(Root);
  using var session = new RealWorldMultitileSession(bundle);
  var snap = session.LoadLod("LOW");
  Assert.AreEqual(9, snap.activeTiles.Length);
  Assert.AreEqual(0, snap.errors.Length);
  Assert.AreEqual(bundle.UniqueFeatures, snap.uniqueMeshCount);
  Assert.Greater(snap.triangleCount, 0);
  Assert.Less(snap.triangleCount, 130); // serialized-with-dupes is 130; unique must be lower
  Assert.AreEqual(130, bundle.Packets.Where(p => p.Key.StartsWith("LOW:")).Sum(p => p.Value.triangles));
 }

 [Test]
 public void FrameAxesAreEastUpNorth() {
  var bundle = RealWorldBundle.Load(Root);
  var t = bundle.TileTransforms["18/143997/83496"];
  Assert.AreEqual(0, t.translation.x, 1e-9);
  Assert.AreEqual(0, t.translation.y, 1e-9);
  Assert.AreEqual(0, t.translation.z, 1e-9);
  Assert.AreEqual(1, t.x.x, 1e-6);
  Assert.AreEqual(1, t.y.y, 1e-6);
  Assert.AreEqual(1, t.z.z, 1e-6);
 }

 [Test]
 public void NeighborSharedCornerAlignsWithinMillimetre() {
  var bundle = RealWorldBundle.Load(Root);
  using var session = new RealWorldMultitileSession(bundle);
  var snap = session.LoadLod("LOW");
  var road = snap.meshes.First(m => m.mesh.id == "osm:way:7001");
  var ns = snap.meshes.First(m => m.mesh.id == "osm:way:7002");
  // Lowest tileId wins for duplicated cross-border features
  Assert.AreEqual("18/143996/83496", road.tileId);
  Assert.AreEqual("18/143997/83495", ns.tileId);
  Assert.AreEqual(1, snap.meshes.Count(m => m.mesh.id == "osm:way:7001"));
  Assert.AreEqual(1, snap.meshes.Count(m => m.mesh.id == "osm:way:7002"));
  var a = RealWorldTransformUtil.TransformPosition(new RealWorldVec3(road.mesh.positions[0], road.mesh.positions[1], road.mesh.positions[2]), road.transform);
  var b = RealWorldTransformUtil.TransformPosition(new RealWorldVec3(road.mesh.positions[road.mesh.positions.Length - 3], road.mesh.positions[road.mesh.positions.Length - 2], road.mesh.positions[road.mesh.positions.Length - 1]), road.transform);
  var span = Math.Sqrt((a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z));
  Assert.Greater(span, 200);
  Assert.Less(span, 280);
  // Ribbon meshes intentionally leave a junction gap; shared feature node 38 must co-locate in scene frame.
  var west = bundle.LoadPacket("18/143996/83496", "LOW");
  var north = bundle.LoadPacket("18/143997/83495", "LOW");
  var fEw = west.tile.features.First(f => f.id == "osm:way:7001");
  var fNs = north.tile.features.First(f => f.id == "osm:way:7002");
  var iEw = Array.IndexOf(fEw.nodeIds, "38");
  var iNs = Array.IndexOf(fNs.nodeIds, "38");
  Assert.GreaterOrEqual(iEw, 0);
  Assert.GreaterOrEqual(iNs, 0);
  var pEw = RealWorldTransformUtil.TransformPosition(fEw.points[iEw], bundle.TileTransforms[west.tile.tileId]);
  var pNs = RealWorldTransformUtil.TransformPosition(fNs.points[iNs], bundle.TileTransforms[north.tile.tileId]);
  var gap = Math.Sqrt((pEw.x - pNs.x) * (pEw.x - pNs.x) + (pEw.y - pNs.y) * (pEw.y - pNs.y) + (pEw.z - pNs.z) * (pEw.z - pNs.z));
  Assert.Less(gap, 0.001);
  var centerOrigin = RealWorldTransformUtil.TransformPosition(new RealWorldVec3(0, 0, 0), bundle.TileTransforms["18/143997/83496"]);
  Assert.Less(Math.Abs(centerOrigin.x) + Math.Abs(centerOrigin.y) + Math.Abs(centerOrigin.z), 1e-6);
  Assert.Less(Math.Sqrt(pEw.x * pEw.x + pEw.z * pEw.z), 0.05);
 }
}
