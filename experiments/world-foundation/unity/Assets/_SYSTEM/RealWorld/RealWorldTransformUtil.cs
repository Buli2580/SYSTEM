using UnityEngine;

namespace SystemWorld.RealWorld {
public static class RealWorldTransformUtil {
 public static RealWorldVec3 TransformNormal(RealWorldVec3 p, RealWorldTransform t) => new RealWorldVec3(
  p.x * t.x.x + p.y * t.y.x + p.z * t.z.x,
  p.x * t.x.y + p.y * t.y.y + p.z * t.z.y,
  p.x * t.x.z + p.y * t.y.z + p.z * t.z.z);

 public static RealWorldVec3 TransformPosition(RealWorldVec3 p, RealWorldTransform t) {
  var v = TransformNormal(p, t);
  return new RealWorldVec3(v.x + t.translation.x, v.y + t.translation.y, v.z + t.translation.z);
 }

 public static Vector3 ToUnity(RealWorldVec3 v) => new Vector3((float)v.x, (float)v.y, (float)v.z);

 public static Vector3 TransformPositionFloat(RealWorldVec3 p, RealWorldTransform t) {
  var v = TransformPosition(p, t);
  return ToUnity(v);
 }

 public static Vector3 TransformNormalFloat(RealWorldVec3 p, RealWorldTransform t) {
  var n = TransformNormal(p, t);
  var u = ToUnity(n);
  return u.sqrMagnitude > 1e-20f ? u.normalized : Vector3.up;
 }
}
}
