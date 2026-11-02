using System.Collections.Generic;
using UnityEngine;

namespace SystemWorld.RealWorld {
/// <summary>Isolated SYNTHETIC multitile lab. No GPS / XP / quest / persistence hooks.</summary>
public sealed class RealWorldMultitileLab : MonoBehaviour {
 public string BundleRootOverride;
 public string InitialLod = "LOW";
 public bool LoadOnStart = true;

 RealWorldBundle bundle;
 RealWorldMultitileSession session;
 readonly List<GameObject> spawned = new List<GameObject>();
 readonly List<Mesh> ownedMeshes = new List<Mesh>();
 readonly List<Material> ownedMaterials = new List<Material>();
 RealWorldSnapshot lastSnapshot;
 string status = "IDLE";
 bool syntheticLabel = true;

 public RealWorldSnapshot LastSnapshot => lastSnapshot;
 public string Status => status;
 public string ActiveLod => session?.ActiveLod;
 public int SpawnedMeshCount => spawned.Count;
 public bool HasSyntheticLabel => syntheticLabel && bundle != null && bundle.DataStatus == "SYNTHETIC";

 public static RealWorldMultitileLab Create(string root = null, string lod = "LOW") {
  var go = new GameObject("REAL_WORLD_MULTITILE_LAB");
  var lab = go.AddComponent<RealWorldMultitileLab>();
  lab.BundleRootOverride = root;
  lab.InitialLod = lod;
  lab.LoadOnStart = false;
  lab.Bootstrap();
  lab.SetLod(lod);
  return lab;
 }

 void Start() {
  if (LoadOnStart) {
   Bootstrap();
   SetLod(InitialLod);
  }
 }

 void Update() {
  if (Input.GetKeyDown(KeyCode.Alpha1) || Input.GetKeyDown(KeyCode.Keypad1)) SetLod("LOW");
  if (Input.GetKeyDown(KeyCode.Alpha2) || Input.GetKeyDown(KeyCode.Keypad2)) SetLod("MEDIUM");
  if (Input.GetKeyDown(KeyCode.Alpha3) || Input.GetKeyDown(KeyCode.Keypad3)) SetLod("HIGH");
  if (Input.GetKeyDown(KeyCode.Alpha4) || Input.GetKeyDown(KeyCode.Keypad4)) SetLod("DISTANT");
 }

 void OnGUI() {
  if (!syntheticLabel) return;
  const int w = 420, h = 72;
  GUI.Box(new Rect(12, 12, w, h), "");
  var style = new GUIStyle(GUI.skin.label) { fontSize = 18, fontStyle = FontStyle.Bold };
  style.normal.textColor = new Color(1f, 0.85f, 0.15f);
  GUI.Label(new Rect(24, 20, w - 24, 28), "SYNTHETIC — NOT ACTUAL LĘBORK", style);
  var sub = new GUIStyle(GUI.skin.label) { fontSize = 12 };
  sub.normal.textColor = Color.white;
  var lod = ActiveLod ?? "-";
  var meshes = lastSnapshot?.uniqueMeshCount ?? 0;
  var tris = lastSnapshot?.triangleCount ?? 0;
  GUI.Label(new Rect(24, 48, w - 24, 24), status + "  LOD=" + lod + "  meshes=" + meshes + "  tris=" + tris, sub);
 }

 public void Bootstrap() {
  ClearVisuals();
  session?.Dispose();
  bundle = string.IsNullOrEmpty(BundleRootOverride) ? RealWorldBundle.Load() : RealWorldBundle.Load(BundleRootOverride);
  if (bundle.DataStatus != "SYNTHETIC" || bundle.ActualLeborkData) throw new System.InvalidOperationException("SYNTHETIC_REQUIRED");
  session = new RealWorldMultitileSession(bundle);
  EnsureCamera();
  status = "READY";
 }

 public RealWorldSnapshot SetLod(string lod) {
  if (session == null) Bootstrap();
  ClearVisuals();
  lastSnapshot = session.LoadLod(lod);
  if (lastSnapshot.errors != null && lastSnapshot.errors.Length > 0) {
   status = "PARTIAL:" + lastSnapshot.errors.Length;
  } else {
   status = "RENDERED:" + lod;
  }
  BuildVisuals(lastSnapshot);
  return lastSnapshot;
 }

 public void Unload() {
  ClearVisuals();
  session?.Dispose();
  session = null;
  lastSnapshot = null;
  status = "UNLOADED";
 }

 void OnDestroy() {
  Unload();
  foreach (var mat in ownedMaterials) if (mat) DestroyImmediateSafe(mat);
  ownedMaterials.Clear();
 }

 void BuildVisuals(RealWorldSnapshot snap) {
  if (snap?.meshes == null) return;
  var root = new GameObject("tiles_" + snap.lod);
  root.transform.SetParent(transform, false);
  spawned.Add(root);
  foreach (var view in snap.meshes) {
    var go = new GameObject(view.mesh.id);
    go.transform.SetParent(root.transform, false);
    var filter = go.AddComponent<MeshFilter>();
    var renderer = go.AddComponent<MeshRenderer>();
    var mesh = BuildUnityMesh(view);
    ownedMeshes.Add(mesh);
    filter.sharedMesh = mesh;
    renderer.sharedMaterial = MaterialFor(view.kind);
    spawned.Add(go);
  }
 }

 Mesh BuildUnityMesh(RealWorldMeshView view) {
  var src = view.mesh;
  var vertCount = src.positions.Length / 3;
  var verts = new Vector3[vertCount];
  var norms = new Vector3[vertCount];
  for (var i = 0; i < vertCount; i++) {
   var lp = new RealWorldVec3(src.positions[i * 3], src.positions[i * 3 + 1], src.positions[i * 3 + 2]);
   var ln = new RealWorldVec3(src.normals[i * 3], src.normals[i * 3 + 1], src.normals[i * 3 + 2]);
   verts[i] = RealWorldTransformUtil.TransformPositionFloat(lp, view.transform);
   norms[i] = RealWorldTransformUtil.TransformNormalFloat(ln, view.transform);
  }
  var mesh = new Mesh { name = src.id + "@" + view.tileId };
  mesh.indexFormat = vertCount > 65000 ? UnityEngine.Rendering.IndexFormat.UInt32 : UnityEngine.Rendering.IndexFormat.UInt16;
  mesh.SetVertices(verts);
  mesh.SetNormals(norms);
  mesh.SetIndices(src.indices, MeshTopology.Triangles, 0, true);
  mesh.RecalculateBounds();
  return mesh;
 }

 Material MaterialFor(string kind) {
  Color c = kind switch {
   "BUILDING" => new Color(0.62f, 0.62f, 0.66f),
   "ROAD" => new Color(0.22f, 0.22f, 0.24f),
   "PARK" => new Color(0.28f, 0.55f, 0.30f),
   "PLAZA" => new Color(0.78f, 0.72f, 0.58f),
   "WATER" => new Color(0.25f, 0.45f, 0.70f),
   _ => new Color(0.55f, 0.55f, 0.55f)
  };
  var shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");
  var mat = new Material(shader) { color = c };
  if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", c);
  ownedMaterials.Add(mat);
  return mat;
 }

 void ClearVisuals() {
  for (var i = spawned.Count - 1; i >= 0; i--) {
   var go = spawned[i];
   if (go) DestroyImmediateSafe(go);
  }
  spawned.Clear();
  foreach (var mesh in ownedMeshes) if (mesh) DestroyImmediateSafe(mesh);
  ownedMeshes.Clear();
 }

 static void DestroyImmediateSafe(Object obj) {
  if (!obj) return;
  if (Application.isPlaying) Object.Destroy(obj);
  else Object.DestroyImmediate(obj);
 }

 static void EnsureCamera() {
  if (Camera.main != null) {
   Camera.main.transform.position = new Vector3(0, 180, -160);
   Camera.main.transform.rotation = Quaternion.Euler(48, 0, 0);
   return;
  }
  var camGo = new GameObject("Main Camera");
  camGo.tag = "MainCamera";
  var cam = camGo.AddComponent<Camera>();
  cam.transform.position = new Vector3(0, 180, -160);
  cam.transform.rotation = Quaternion.Euler(48, 0, 0);
  cam.clearFlags = CameraClearFlags.SolidColor;
  cam.backgroundColor = new Color(0.12f, 0.14f, 0.16f);
  var light = new GameObject("Directional Light");
  var l = light.AddComponent<Light>();
  l.type = LightType.Directional;
  l.transform.rotation = Quaternion.Euler(50, -30, 0);
 }
}
}
