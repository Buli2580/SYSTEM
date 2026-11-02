using System;
using System.Collections.Generic;

namespace SystemWorld.RealWorld {
public enum RealWorldLod { HIGH, MEDIUM, LOW, DISTANT }

[Serializable] public struct RealWorldGeo {
 public double latitude, longitude, altitude;
}

[Serializable] public struct RealWorldVec3 {
 public double x, y, z;
 public RealWorldVec3(double x, double y, double z) { this.x = x; this.y = y; this.z = z; }
}

[Serializable] public sealed class RealWorldFeature {
 public string id;
 public string kind;
 public string[] nodeIds;
 public RealWorldVec3[] points;
 [NonSerialized] public Dictionary<string, string> tags;
}

[Serializable] public sealed class RealWorldProvenance {
 public string kind;
 public string datasetId;
 public string sourceUrl;
 public string retrievedAt;
}

[Serializable] public sealed class RealWorldTile {
 public int version;
 public string datasetId;
 public string tileId;
 public RealWorldGeo origin;
 public RealWorldProvenance provenance;
 public string attribution;
 public RealWorldFeature[] features;
}

[Serializable] public sealed class RealWorldFacade {
 public string style;
 public int floors;
}

[Serializable] public sealed class RealWorldMesh {
 public string id;
 public string lod;
 public double[] positions;
 public int[] indices;
 public double[] normals;
 public double height;
 public string heightSource;
 public string geometryQuality;
 public string roofModel;
 public string requestedRoof;
 public string buildingClass;
 public double orientationDegrees;
 public RealWorldFacade facade;
}

[Serializable] public sealed class RealWorldMeshDiagnostic {
 public string id;
 public string code;
}

[Serializable] public sealed class RealWorldPacket {
 public string protocolVersion;
 public RealWorldTile tile;
 public RealWorldMesh[] meshes;
 public RealWorldMeshDiagnostic[] meshDiagnostics;
 public string rawJson;
 public int utf8Bytes;
}

[Serializable] public sealed class RealWorldTransform {
 public RealWorldVec3 translation, x, y, z;
}

[Serializable] public sealed class RealWorldMeshView {
 public RealWorldMesh mesh;
 public string tileId;
 public RealWorldTransform transform;
 public string kind;
}

[Serializable] public sealed class RealWorldSnapshot {
 public string[] activeTiles;
 public string lod;
 public RealWorldMeshView[] meshes;
 public int packetBytes;
 public int meshBytes;
 public string[] errors;
 public int uniqueMeshCount;
 public int triangleCount;
}
}
