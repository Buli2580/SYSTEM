using System;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace SystemWorld.RealWorld {
/// <summary>
/// Ensures the synthetic multitile package is readable via System.IO on every platform.
/// Editor/standalone use StreamingAssets (or examples) directly. Android extracts once
/// from the APK StreamingAssets jar into persistentDataPath (no PC paths / junctions).
/// </summary>
public static class RealWorldStreamingUtil {
 public const string RelativeFolder = "real-world-2.4-multitile-synthetic";
 const string MarkerName = ".system_rw24_extracted";

 public static string EnsureReadableRoot() {
  var env = Environment.GetEnvironmentVariable("SYSTEM_REAL_WORLD_2_4_ROOT");
  if (!string.IsNullOrEmpty(env) && Directory.Exists(env) && File.Exists(Path.Combine(env, "manifest.json")))
   return Path.GetFullPath(env);

#if UNITY_ANDROID && !UNITY_EDITOR
  return EnsureAndroidExtractedRoot();
#else
  var streaming = Path.Combine(Application.streamingAssetsPath, RelativeFolder);
  if (Directory.Exists(streaming) && File.Exists(Path.Combine(streaming, "manifest.json")))
   return Path.GetFullPath(streaming);
  var candidates = new[] {
   Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "..", "examples", RelativeFolder)),
   @"C:\SYSTEM\SYSTEM-RC2\examples\real-world-2.4-multitile-synthetic"
  };
  foreach (var c in candidates)
   if (Directory.Exists(c) && File.Exists(Path.Combine(c, "manifest.json"))) return c;
  throw new FileNotFoundException("REAL_WORLD_2_4_ROOT_MISSING");
#endif
 }

#if UNITY_ANDROID && !UNITY_EDITOR
 static string EnsureAndroidExtractedRoot() {
  var destRoot = Path.Combine(Application.persistentDataPath, RelativeFolder);
  var marker = Path.Combine(destRoot, MarkerName);
  var manifestDest = Path.Combine(destRoot, "manifest.json");
  if (File.Exists(marker) && File.Exists(manifestDest)) return destRoot;

  Directory.CreateDirectory(destRoot);
  var streamingManifest = Application.streamingAssetsPath + "/" + RelativeFolder + "/manifest.json";
  var manifestBytes = ReadStreamingBytes(streamingManifest);
  File.WriteAllBytes(manifestDest, manifestBytes);
  var manifestText = Encoding.UTF8.GetString(manifestBytes);
  // Minimal listing: packets[].file + files[].file (avoid full validator dependency here).
  ExtractListedFiles(manifestText, destRoot);
  File.WriteAllText(marker, "v1");
  return destRoot;
 }

 static void ExtractListedFiles(string manifestJson, string destRoot) {
  void CopyRel(string rel) {
   if (string.IsNullOrEmpty(rel) || rel.Contains("..")) throw new FormatException("CITY_PATH");
   var url = Application.streamingAssetsPath + "/" + RelativeFolder + "/" + rel;
   var dest = Path.Combine(destRoot, rel.Replace('/', Path.DirectorySeparatorChar));
   Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? destRoot);
   File.WriteAllBytes(dest, ReadStreamingBytes(url));
  }
  // Cheap field scrape keeps this helper free of Newtonsoft during early bootstrap.
  var idx = 0;
  while (true) {
   var fileKey = manifestJson.IndexOf("\"file\"", idx, StringComparison.Ordinal);
   if (fileKey < 0) break;
   var colon = manifestJson.IndexOf(':', fileKey);
   var q1 = manifestJson.IndexOf('"', colon + 1);
   var q2 = manifestJson.IndexOf('"', q1 + 1);
   if (colon < 0 || q1 < 0 || q2 < 0) break;
   var rel = manifestJson.Substring(q1 + 1, q2 - q1 - 1);
   idx = q2 + 1;
   if (rel.EndsWith(".json", StringComparison.Ordinal) || rel == "source.osm" || rel == "source-preview.svg" || rel == ".gitattributes")
    CopyRel(rel);
  }
 }

 static byte[] ReadStreamingBytes(string url) {
  using var req = UnityWebRequest.Get(url);
  var op = req.SendWebRequest();
  while (!op.isDone) { }
  if (req.result != UnityWebRequest.Result.Success)
   throw new FileNotFoundException("STREAMING_READ_FAILED:" + url + ":" + req.error);
  return req.downloadHandler.data ?? Array.Empty<byte>();
 }
#endif
}
}
