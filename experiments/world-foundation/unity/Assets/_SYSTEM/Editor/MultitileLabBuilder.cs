using System.IO;
using SystemWorld.RealWorld;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class MultitileLabBuilder {
 const string ScenePath = "Assets/_SYSTEM/Scenes/REAL_WORLD_MULTITILE_LAB.unity";
 const string FoundationScene = "Assets/_SYSTEM/Scenes/WORLD_FOUNDATION.unity";

 [MenuItem("SYSTEM/Real World/Prepare MULTITILE LAB Scene")]
 public static void PrepareLab() {
  if (!File.Exists(FoundationScene))
   Debug.LogWarning("WORLD_FOUNDATION.unity missing — lab still created in isolation.");
  var existing = EditorBuildSettings.scenes;
  EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
  var labGo = new GameObject("REAL_WORLD_MULTITILE_LAB");
  var lab = labGo.AddComponent<RealWorldMultitileLab>();
  lab.InitialLod = "LOW";
  lab.LoadOnStart = true;
  var cam = Camera.main;
  if (cam != null) {
   cam.transform.position = new Vector3(0, 180, -160);
   cam.transform.rotation = Quaternion.Euler(48, 0, 0);
   cam.clearFlags = CameraClearFlags.SolidColor;
   cam.backgroundColor = new Color(0.12f, 0.14f, 0.16f);
  }
  Directory.CreateDirectory("Assets/_SYSTEM/Scenes");
  EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), ScenePath);
  // Preserve Android export entry (FOUNDATION). Lab is optional/editor-only enabled=false if listed.
  var list = new System.Collections.Generic.List<EditorBuildSettingsScene>(existing);
  if (!list.Exists(s => s.path == ScenePath))
   list.Add(new EditorBuildSettingsScene(ScenePath, false));
  // Never drop FOUNDATION from build settings.
  if (File.Exists(FoundationScene) && !list.Exists(s => s.path == FoundationScene))
   list.Insert(0, new EditorBuildSettingsScene(FoundationScene, true));
  EditorBuildSettings.scenes = list.ToArray();
  AssetDatabase.SaveAssets();
  Debug.Log("REAL WORLD MULTITILE LAB saved at " + ScenePath + " (FOUNDATION untouched).");
 }

 [MenuItem("SYSTEM/Real World/Validate 2.4 Bundle (EditMode path)")]
 public static void ValidateBundleMenu() {
  var bundle = RealWorldBundle.Load();
  var n = 0;
  foreach (var lod in new[] { "LOW", "MEDIUM", "HIGH", "DISTANT" })
   foreach (var id in bundle.TileIds) {
    bundle.LoadPacket(id, lod);
    n++;
   }
  Debug.Log("Validated " + n + " packets from " + bundle.Root + " SYNTHETIC=" + bundle.DataStatus);
 }
}
