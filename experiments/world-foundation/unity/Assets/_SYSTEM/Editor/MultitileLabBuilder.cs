using System.IO;
using SystemWorld.RealWorld;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class MultitileLabBuilder {
 const string ScenePath = "Assets/_SYSTEM/Scenes/REAL_WORLD_MULTITILE_LAB.unity";
 const string FoundationScene = "Assets/_SYSTEM/Scenes/WORLD_FOUNDATION.unity";
 const string ExportPath = @"E:\SYSTEM\.tmp\system-world-foundation\unity-export-multitile-lab";
 const string SyntheticSrc = @"C:\SYSTEM\SYSTEM-RC2\examples\real-world-2.4-multitile-synthetic";
 const string StreamingRel = "Assets/StreamingAssets/real-world-2.4-multitile-synthetic";

 [MenuItem("SYSTEM/Real World/Prepare MULTITILE LAB Scene")]
 public static void PrepareLab() {
  if (!File.Exists(FoundationScene))
   Debug.LogWarning("WORLD_FOUNDATION.unity missing — lab still created in isolation.");
  var existing = EditorBuildSettings.scenes;
  EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
  var labGo = new GameObject("REAL_WORLD_MULTITILE_LAB");
  var lab = labGo.AddComponent<RealWorldMultitileLab>();
  lab.InitialLod = "LOW";
  lab.LoadOnStart = false;
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

 [MenuItem("SYSTEM/Real World/Materialize StreamingAssets Copy")]
 public static void MaterializeStreamingAssets() {
  if (!Directory.Exists(SyntheticSrc))
   throw new DirectoryNotFoundException("Synthetic package missing: " + SyntheticSrc);
  var dest = Path.GetFullPath(StreamingRel);
  if (Directory.Exists(dest)) {
   var attrs = File.GetAttributes(dest);
   if ((attrs & FileAttributes.ReparsePoint) != 0) {
    // Remove junction without deleting the examples target.
#if UNITY_EDITOR_WIN
    var ok = NativeMethods.RemoveDirectory(dest);
    if (!ok) throw new IOException("Failed to remove StreamingAssets junction: " + dest);
#else
    Directory.Delete(dest);
#endif
   } else {
    Directory.Delete(dest, true);
   }
  }
  Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? "Assets/StreamingAssets");
  CopyDirectoryReal(SyntheticSrc, dest);
  AssetDatabase.Refresh();
  var fileCount = Directory.GetFiles(dest, "*", SearchOption.AllDirectories).Length;
  Debug.Log("Materialized StreamingAssets copy (" + fileCount + " files) at " + dest + " (not a junction).");
 }

 /// <summary>
 /// Exports MULTITILE LAB only to a SEPARATE Gradle folder. Does NOT call FoundationBuilder.Prepare
 /// and does NOT overwrite WORLD_FOUNDATION.unity or the foundation unity-export directory.
 /// Restores EditorBuildSettings afterwards (FOUNDATION enabled, lab disabled).
 /// </summary>
 public static void ExportAndroid() {
  MaterializeStreamingAssets();
  if (!File.Exists(ScenePath)) PrepareLab();
  else {
   var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
   var lab = Object.FindFirstObjectByType<RealWorldMultitileLab>();
   if (lab == null) {
    var go = new GameObject("REAL_WORLD_MULTITILE_LAB");
    lab = go.AddComponent<RealWorldMultitileLab>();
   }
   lab.InitialLod = "LOW";
   lab.LoadOnStart = false;
   EditorSceneManager.MarkSceneDirty(scene);
   EditorSceneManager.SaveScene(scene);
  }

  var previous = EditorBuildSettings.scenes;
  try {
   EditorBuildSettings.scenes = new[] {
    new EditorBuildSettingsScene(ScenePath, true),
    new EditorBuildSettingsScene(FoundationScene, false)
   };
   if (Directory.Exists(ExportPath)) {
    // Fresh export directory so prior foundation binaries are not mixed in.
    FileUtil.DeleteFileOrDirectory(ExportPath);
   }
   Directory.CreateDirectory(Path.GetDirectoryName(ExportPath) ?? ExportPath);
   EditorUserBuildSettings.exportAsGoogleAndroidProject = true;
   var entry = typeof(PlayerSettings.Android).GetProperty("applicationEntry");
   if (entry == null) throw new System.Exception("Android Activity entry API missing");
   entry.SetValue(null, System.Enum.Parse(entry.PropertyType, "Activity"));
   PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
   PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
   PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel31;
   var result = BuildPipeline.BuildPlayer(new BuildPlayerOptions {
    scenes = new[] { ScenePath },
    target = BuildTarget.Android,
    locationPathName = ExportPath,
    options = BuildOptions.Development
   });
   if (result.summary.result != BuildResult.Succeeded)
    throw new System.Exception("Multitile lab Android export failed: " + result.summary.result);
   Debug.Log("MULTITILE LAB Android export OK → " + ExportPath);
  } finally {
   // Restore protected spike defaults: FOUNDATION enabled, lab listed but disabled.
   var restored = new System.Collections.Generic.List<EditorBuildSettingsScene>();
   if (File.Exists(FoundationScene))
    restored.Add(new EditorBuildSettingsScene(FoundationScene, true));
   if (File.Exists(ScenePath))
    restored.Add(new EditorBuildSettingsScene(ScenePath, false));
   foreach (var s in previous) {
    if (s.path == FoundationScene || s.path == ScenePath) continue;
    restored.Add(s);
   }
   EditorBuildSettings.scenes = restored.ToArray();
   AssetDatabase.SaveAssets();
  }
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

 static void CopyDirectoryReal(string src, string dest) {
  Directory.CreateDirectory(dest);
  foreach (var file in Directory.GetFiles(src)) {
   var name = Path.GetFileName(file);
   File.Copy(file, Path.Combine(dest, name), true);
  }
  foreach (var dir in Directory.GetDirectories(src)) {
   var name = Path.GetFileName(dir);
   CopyDirectoryReal(dir, Path.Combine(dest, name));
  }
 }

#if UNITY_EDITOR_WIN
 static class NativeMethods {
  [System.Runtime.InteropServices.DllImport("kernel32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode, SetLastError = true)]
  public static extern bool RemoveDirectory(string pathName);
 }
#endif
}
