using UnityEngine;
namespace SystemWorld {
public sealed class FoundationBootstrap:MonoBehaviour {
 void Awake(){
  var world=WorldFoundation.Create();
  world.transform.SetParent(transform,false);
 }
}
}
