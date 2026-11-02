using System.Collections;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SystemWorld.RealWorld;
using UnityEngine;
using UnityEngine.TestTools;

public class RealWorldMultitilePlayTests {
 static string Root => RealWorldBundle.ResolveDefaultRoot();

 [UnityTest]
 public IEnumerator LoadsNineLowTilesWithSyntheticLabelAndGeometry() {
  var lab = RealWorldMultitileLab.Create(Root, "LOW");
  yield return null;
  Assert.AreEqual("SYNTHETIC", lab.HasSyntheticLabel ? "SYNTHETIC" : "MISSING");
  Assert.True(lab.HasSyntheticLabel);
  var snap = lab.LastSnapshot;
  Assert.NotNull(snap);
  Assert.AreEqual("LOW", snap.lod);
  Assert.AreEqual(9, snap.activeTiles.Length);
  Assert.AreEqual(0, snap.errors.Length);
  Assert.AreEqual(14, snap.uniqueMeshCount);
  Assert.AreEqual(snap.uniqueMeshCount, lab.SpawnedMeshCount - 1); // root + meshes
  Assert.Greater(snap.triangleCount, 40);
  Assert.Less(snap.triangleCount, 130);

  var building = snap.meshes.First(m => m.mesh.id == "osm:way:1004");
  var bmin = new Vector3(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity);
  var bmax = new Vector3(float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity);
  for (var i = 0; i < building.mesh.positions.Length; i += 3) {
   var p = RealWorldTransformUtil.TransformPositionFloat(
    new RealWorldVec3(building.mesh.positions[i], building.mesh.positions[i + 1], building.mesh.positions[i + 2]),
    building.transform);
   bmin = Vector3.Min(bmin, p);
   bmax = Vector3.Max(bmax, p);
  }
  Assert.Greater(bmax.y - bmin.y, 8f);
  Assert.Less(bmax.y - bmin.y, 12f);
  Assert.Greater(bmax.x - bmin.x, 10f);
  Assert.Less(bmax.x - bmin.x, 14f);

  var road = snap.meshes.First(m => m.mesh.id == "osm:way:7001");
  var foot = snap.meshes.First(m => m.mesh.id == "osm:way:7003");
  Assert.AreEqual(1, snap.meshes.Count(m => m.mesh.id == "osm:way:7001"));
  Assert.AreEqual(1, snap.meshes.Count(m => m.mesh.id == "osm:way:7003"));
  // Road normals mostly up after transform
  var upHits = 0;
  for (var i = 0; i < road.mesh.normals.Length; i += 3) {
   var n = RealWorldTransformUtil.TransformNormalFloat(
    new RealWorldVec3(road.mesh.normals[i], road.mesh.normals[i + 1], road.mesh.normals[i + 2]),
    road.transform);
   if (n.y > 0.9f) upHits++;
  }
  Assert.Greater(upHits, road.mesh.normals.Length / 3 / 2);

  // Cross-tile road span remains continuous in shared frame
  var a = RealWorldTransformUtil.TransformPositionFloat(new RealWorldVec3(road.mesh.positions[0], road.mesh.positions[1], road.mesh.positions[2]), road.transform);
  var b = RealWorldTransformUtil.TransformPositionFloat(new RealWorldVec3(road.mesh.positions[road.mesh.positions.Length - 3], road.mesh.positions[road.mesh.positions.Length - 2], road.mesh.positions[road.mesh.positions.Length - 1]), road.transform);
  Assert.Greater(Vector2.Distance(new Vector2(a.x, a.z), new Vector2(b.x, b.z)), 200f);

  // Footway stays north of EW road centerline (z≈12 local on center tile)
  var footMid = RealWorldTransformUtil.TransformPositionFloat(
   new RealWorldVec3(foot.mesh.positions[foot.mesh.positions.Length / 2 / 3 * 3], foot.mesh.positions[foot.mesh.positions.Length / 2 / 3 * 3 + 1], foot.mesh.positions[foot.mesh.positions.Length / 2 / 3 * 3 + 2]),
   foot.transform);
  Assert.Greater(footMid.z, 5f);

  Object.Destroy(lab.gameObject);
  yield return null;
 }

 [UnityTest]
 public IEnumerator LodSwitchKeepsOneVariantAndReleasesMeshes() {
  var lab = RealWorldMultitileLab.Create(Root, "LOW");
  yield return null;
  var lowTris = lab.LastSnapshot.triangleCount;
  var lowMeshes = lab.LastSnapshot.uniqueMeshCount;
  lab.SetLod("HIGH");
  yield return null;
  Assert.AreEqual("HIGH", lab.ActiveLod);
  Assert.AreEqual(9, lab.LastSnapshot.activeTiles.Length);
  Assert.AreEqual(lowMeshes, lab.LastSnapshot.uniqueMeshCount);
  Assert.AreEqual(lowTris, lab.LastSnapshot.triangleCount); // same topology across LOD in this fixture
  lab.SetLod("MEDIUM");
  yield return null;
  lab.SetLod("DISTANT");
  yield return null;
  lab.SetLod("LOW");
  yield return null;
  Assert.AreEqual("LOW", lab.ActiveLod);
  Assert.AreEqual(lowMeshes, lab.LastSnapshot.uniqueMeshCount);
  // Only one LOD present in hierarchy
  var ids = new HashSet<string>();
  foreach (var mf in lab.GetComponentsInChildren<MeshFilter>()) {
   if (mf.sharedMesh == null) continue;
   Assert.True(ids.Add(mf.sharedMesh.name.Split('@')[0]), "duplicate mesh id visible");
  }
  lab.Unload();
  yield return null;
  Assert.AreEqual(0, lab.SpawnedMeshCount);
  Assert.AreEqual("UNLOADED", lab.Status);
  Object.Destroy(lab.gameObject);
  yield return null;
  // Reload cycle — no leftover session
  var lab2 = RealWorldMultitileLab.Create(Root, "LOW");
  yield return null;
  Assert.AreEqual(14, lab2.LastSnapshot.uniqueMeshCount);
  lab2.Unload();
  Object.Destroy(lab2.gameObject);
  yield return null;
 }

 [UnityTest]
 public IEnumerator DisposePreventsFurtherLoads() {
  var bundle = RealWorldBundle.Load(Root);
  var session = new RealWorldMultitileSession(bundle);
  session.LoadLod("LOW");
  session.Dispose();
  Assert.Throws<System.ObjectDisposedException>(() => session.LoadLod("HIGH"));
  yield return null;
 }
}
