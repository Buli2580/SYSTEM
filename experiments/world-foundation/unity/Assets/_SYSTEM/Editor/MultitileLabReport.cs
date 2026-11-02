using System.IO;
using System.Linq;
using System.Text;
using SystemWorld.RealWorld;
using UnityEditor;
using UnityEngine;

public static class MultitileLabReport {
 const string OutPath = @"C:\SYSTEM\SYSTEM-RC2\examples\real-world-2.4-evidence\unity-multitile-render-stats.json";

 public static void Capture() {
  var bundle = RealWorldBundle.Load();
  using var session = new RealWorldMultitileSession(bundle);
  var sb = new StringBuilder();
  sb.Append("{\n");
  sb.Append("  \"dataStatus\": \"").Append(bundle.DataStatus).Append("\",\n");
  sb.Append("  \"actualLeborkData\": ").Append(bundle.ActualLeborkData ? "true" : "false").Append(",\n");
  sb.Append("  \"root\": ").Append(JsonEscape(bundle.Root)).Append(",\n");
  sb.Append("  \"tileCount\": ").Append(bundle.TileIds.Length).Append(",\n");
  sb.Append("  \"uniqueFeatures\": ").Append(bundle.UniqueFeatures).Append(",\n");
  sb.Append("  \"lods\": {\n");
  var lods = new[] { "LOW", "MEDIUM", "HIGH", "DISTANT" };
  for (var i = 0; i < lods.Length; i++) {
   var snap = session.LoadLod(lods[i]);
   var kinds = snap.meshes.GroupBy(m => m.kind).ToDictionary(g => g.Key, g => g.Count());
   sb.Append("    \"").Append(lods[i]).Append("\": {\n");
   sb.Append("      \"activeTiles\": ").Append(snap.activeTiles.Length).Append(",\n");
   sb.Append("      \"errors\": ").Append(snap.errors.Length).Append(",\n");
   sb.Append("      \"uniqueMeshes\": ").Append(snap.uniqueMeshCount).Append(",\n");
   sb.Append("      \"triangles\": ").Append(snap.triangleCount).Append(",\n");
   sb.Append("      \"packetBytes\": ").Append(snap.packetBytes).Append(",\n");
   sb.Append("      \"meshBytes\": ").Append(snap.meshBytes).Append(",\n");
   sb.Append("      \"serializedTrianglesAllTiles\": ").Append(bundle.Packets.Where(p => p.Key.StartsWith(lods[i] + ":")).Sum(p => p.Value.triangles)).Append(",\n");
   sb.Append("      \"kinds\": { ").Append(string.Join(", ", kinds.OrderBy(k => k.Key).Select(k => "\"" + k.Key + "\": " + k.Value))).Append(" }\n");
   sb.Append("    }").Append(i + 1 < lods.Length ? "," : "").Append("\n");
  }
  // Reload LOW and spawn once for hierarchy count
  var lab = RealWorldMultitileLab.Create(bundle.Root, "LOW");
  var filters = lab.GetComponentsInChildren<MeshFilter>();
  var spawnedMeshes = filters.Count(f => f.sharedMesh != null);
  var trisGpu = filters.Where(f => f.sharedMesh != null).Sum(f => f.sharedMesh.triangles.Length / 3);
  Object.DestroyImmediate(lab.gameObject);
  sb.Append("  },\n");
  sb.Append("  \"playSpawn\": {\n");
  sb.Append("    \"meshFilters\": ").Append(spawnedMeshes).Append(",\n");
  sb.Append("    \"triangles\": ").Append(trisGpu).Append("\n");
  sb.Append("  },\n");
  sb.Append("  \"scene\": \"Assets/_SYSTEM/Scenes/REAL_WORLD_MULTITILE_LAB.unity\",\n");
  sb.Append("  \"foundationUntouchedSha256\": \"5E76B5D19F1C0DAB14D98E843431919DE67E02D083BE2FB3FDA968C500FCEF64\"\n");
  sb.Append("}\n");
  Directory.CreateDirectory(Path.GetDirectoryName(OutPath));
  File.WriteAllText(OutPath, sb.ToString());
  Debug.Log("Wrote " + OutPath);
 }

 static string JsonEscape(string s) => "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
}
