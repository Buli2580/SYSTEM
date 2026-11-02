using System;
using UnityEngine;
using UnityEngine.Rendering.Universal;
namespace SystemWorld {
public sealed class WorldFoundation:MonoBehaviour {
 public Vector2 MovementInput=>stick;
 public CharacterController Motor{get;private set;}
 public string MotionState{get;private set;}="Idle";
 public string Quality{get;private set;}="MEDIUM";
 public int FpsTarget{get;private set;}=30;
 public bool NearPortal=>Motor!=null&&Vector3.Distance(Motor.transform.position,new Vector3(0,0,9f))<4f;
 public WorldBridgeClient Bridge{get;private set;}
 readonly System.Collections.Generic.List<Material> materials=new System.Collections.Generic.List<Material>();
 Transform body,leftLeg,rightLeg,leftArm,rightArm; Camera view; Vector2 stick,look;
 int moveFinger=-1,lookFinger=-1; Vector2 stickOrigin,lastLook; float yaw,pitch=18,vertical,phase;
 string directive="TEMP PROCEDURAL AVATAR — not M1"; float measuredTime; int measuredFrames; bool auto=true,held;
 ParticleSystem portalFx; UniversalRenderPipelineAsset pipeline; float originalScale; float originalShadowDistance; int originalShadowMap;
 public static WorldFoundation Create(){var g=new GameObject("WORLD_FOUNDATION");return g.AddComponent<WorldFoundation>();}
 void Awake(){
  Application.targetFrameRate=30;
  Bridge=new GameObject("SystemWorldBridge").AddComponent<WorldBridgeClient>();
  Bridge.transform.SetParent(transform); Bridge.Message+=OnMessage;
  Primitive("Test terrain",PrimitiveType.Cube,new Vector3(0,-.5f,0),new Vector3(36,1,36),new Color(.12f,.19f,.22f));
  for(int i=0;i<7;i++)Primitive("Collision pillar",PrimitiveType.Cube,new Vector3(-9+i*3,1.5f,7),new Vector3(1,3,1),new Color(.24f,.31f,.36f));
  var player=new GameObject("TEMP procedural test avatar"); player.transform.SetParent(transform); player.layer=2;
  Motor=player.AddComponent<CharacterController>(); Motor.height=1.8f; Motor.radius=.32f; Motor.center=Vector3.up*.9f;
  player.transform.position=new Vector3(0,.1f,-5);
  body=Part("TEMP torso",player.transform,new Vector3(0,1.15f,0),new Vector3(.65f,.75f,.35f));
  Part("TEMP head",player.transform,new Vector3(0,1.73f,0),Vector3.one*.36f);
  leftLeg=Part("left leg",player.transform,new Vector3(-.18f,.42f,0),new Vector3(.23f,.8f,.25f));
  rightLeg=Part("right leg",player.transform,new Vector3(.18f,.42f,0),new Vector3(.23f,.8f,.25f));
  leftArm=Part("left arm",player.transform,new Vector3(-.46f,1.15f,0),new Vector3(.22f,.8f,.22f));
  rightArm=Part("right arm",player.transform,new Vector3(.46f,1.15f,0),new Vector3(.22f,.8f,.22f));
  var cam=new GameObject("TPS collision camera"); cam.transform.SetParent(transform); cam.tag="MainCamera";
  view=cam.AddComponent<Camera>(); cam.AddComponent<AudioListener>(); view.nearClipPlane=.08f; view.fieldOfView=60;
  cam.AddComponent<UniversalAdditionalCameraData>();
  var sun=new GameObject("Sun").AddComponent<Light>(); sun.transform.SetParent(transform); sun.type=LightType.Directional;
  sun.intensity=1.4f; sun.transform.rotation=Quaternion.Euler(48,-25,0); sun.shadows=LightShadows.Soft;
  RenderSettings.ambientLight=new Color(.45f,.5f,.6f);
  Primitive("Portal — OPEN QUESTS",PrimitiveType.Cube,new Vector3(0,1.5f,9),new Vector3(2.5f,3,.35f),new Color(.05f,.6f,.8f));
  var fx=new GameObject("Bounded portal particles"); fx.transform.SetParent(transform); fx.transform.position=new Vector3(0,1.5f,8.6f);
  portalFx=fx.AddComponent<ParticleSystem>(); var main=portalFx.main; main.maxParticles=32; main.startLifetime=1; main.startSpeed=.2f; main.startSize=.08f;
  var emission=portalFx.emission; emission.rateOverTime=12;
  pipeline=UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline as UniversalRenderPipelineAsset;
  if(pipeline!=null){originalScale=pipeline.renderScale; originalShadowDistance=pipeline.shadowDistance; originalShadowMap=pipeline.mainLightShadowmapResolution;}
  SetQuality(SystemInfo.systemMemorySize<6000||SystemInfo.graphicsMemorySize<2000?"LOW":"MEDIUM");
  gameObject.AddComponent<WorldFrameRecorder>();
 }
 void Start(){
#if UNITY_ANDROID && !UNITY_EDITOR
  using(var native=new AndroidJavaClass("com.system.worldfoundation.WorldBridge")) native.CallStatic("ready");
#endif
 }
 GameObject Primitive(string n,PrimitiveType type,Vector3 p,Vector3 size,Color c){
  var g=GameObject.CreatePrimitive(type); g.name=n; g.transform.SetParent(transform); g.transform.position=p; g.transform.localScale=size;
  var shader=Shader.Find("Universal Render Pipeline/Lit")??Shader.Find("Unlit/Color")??Shader.Find("Sprites/Default");
  if(shader!=null){var material=new Material(shader){color=c}; materials.Add(material); g.GetComponent<Renderer>().sharedMaterial=material;}
  return g;
 }
 Transform Part(string n,Transform parent,Vector3 p,Vector3 size){
  var g=Primitive(n,PrimitiveType.Cube,Vector3.zero,size,new Color(.35f,.8f,.8f));
  g.transform.SetParent(parent,false); g.transform.localPosition=p; g.layer=parent.gameObject.layer;
  Destroy(g.GetComponent<Collider>()); return g.transform;
 }
 public void SetMovement(Vector2 value,bool persist=false){stick=Vector2.ClampMagnitude(value,1); held=persist;}
 public void ResetInput(){stick=Vector2.zero; look=Vector2.zero; moveFinger=-1; lookFinger=-1; held=false;}
 public bool InteractPortal(){return NearPortal&&Bridge!=null&&Bridge.Command("OPEN_PANEL","QUESTS");}
 void OnApplicationPause(bool paused){if(paused)ResetInput();}
 void OnApplicationFocus(bool focused){if(!focused)ResetInput();}
 void OnMessage(WorldEnvelope e){
  if(e.type=="WORLD_PAUSE"||e.type=="WORLD_DISPOSE")ResetInput();
  if(e.type=="WORLD_INIT")SetQuality((string)e.payload["quality"]);
  if(e.type=="WORLD_DIRECTIVE")directive=(string)e.payload["message"];
  if(e.type=="WORLD_SNAPSHOT")directive=(string)e.payload["displayName"]+" | REAL LEVEL "+e.payload["realLevel"]+" | XP "+e.payload["realXp"];
 }
 void Update(){
  if(Bridge==null||Bridge.Disposed||Bridge.Paused)return;
  if(Input.touchCount>0)ReadTouch();
  else if(!held){
#if ENABLE_LEGACY_INPUT_MANAGER
   stick=new Vector2(Input.GetAxisRaw("Horizontal"),Input.GetAxisRaw("Vertical"));
   if(Input.GetMouseButton(1)){yaw+=Input.GetAxis("Mouse X")*3; pitch-=Input.GetAxis("Mouse Y")*3;}
   if(Input.GetKeyDown(KeyCode.E))InteractPortal();
#endif
  }
  Vector2 input=Vector2.ClampMagnitude(stick,1);
  yaw+=look.x*.14f; pitch=Mathf.Clamp(pitch-look.y*.14f,-10,60); look=Vector2.zero;
  var direction=Quaternion.Euler(0,yaw,0)*new Vector3(input.x,0,input.y);
  bool run=input.magnitude>.75f; float speed=run?4.5f:2f;
  if(Motor.isGrounded&&vertical<0)vertical=-2f;
  vertical+=Physics.gravity.y*Time.deltaTime;
  Motor.Move((direction*speed+Vector3.up*vertical)*Mathf.Min(Time.deltaTime,.05f));
  if(direction.sqrMagnitude>.001f)Motor.transform.rotation=Quaternion.Slerp(Motor.transform.rotation,Quaternion.LookRotation(direction),12*Time.deltaTime);
  MotionState=input.sqrMagnitude<.01f?"Idle":run?"Run":"Walk";
  phase+=Time.deltaTime*(run?10f:6f);
  float swing=MotionState=="Idle"?0:Mathf.Sin(phase)*(run?42f:22f);
  leftLeg.localRotation=Quaternion.Euler(swing,0,0); rightLeg.localRotation=Quaternion.Euler(-swing,0,0);
  leftArm.localRotation=Quaternion.Euler(-swing,0,0); rightArm.localRotation=Quaternion.Euler(swing,0,0);
  body.localScale=new Vector3(.65f,.75f+Mathf.Sin(Time.time*2f)*.012f,.35f);
  measuredTime+=Time.unscaledDeltaTime; measuredFrames++;
  if(auto&&measuredTime>=10f){if(measuredTime*1000f/measuredFrames>38f&&Quality!="LOW")SetQuality("LOW"); auto=false;}
 }
 void LateUpdate(){
  if(Motor==null||view==null)return;
  Vector3 target=Motor.transform.position+Vector3.up*1.4f;
  var direction=Quaternion.Euler(pitch,yaw,0)*Vector3.back; float distance=4.5f;
  if(Physics.SphereCast(target,.2f,direction,out var hit,distance,~0,QueryTriggerInteraction.Ignore)&&hit.collider.transform.root!=Motor.transform)
   distance=Mathf.Max(.5f,hit.distance-.1f);
  view.transform.position=target+direction*distance; view.transform.LookAt(target);
 }
 void ReadTouch(){
  bool foundMove=false,foundLook=false;
  foreach(var t in Input.touches){
   if(t.phase==TouchPhase.Began){
    if(t.position.x<Screen.width*.45f&&t.position.y<Screen.height*.6f&&moveFinger<0){moveFinger=t.fingerId; stickOrigin=t.position;}
    else if(t.position.x>Screen.width*.45f&&lookFinger<0){lookFinger=t.fingerId; lastLook=t.position;}
   }
   if(t.fingerId==moveFinger){foundMove=true; stick=Vector2.ClampMagnitude((t.position-stickOrigin)/90f,1);}
   if(t.fingerId==lookFinger){foundLook=true; look=t.position-lastLook; lastLook=t.position;}
   if(t.phase==TouchPhase.Ended||t.phase==TouchPhase.Canceled){
    if(t.fingerId==moveFinger){moveFinger=-1; stick=Vector2.zero;}
    if(t.fingerId==lookFinger)lookFinger=-1;
   }
  }
  if(!foundMove){moveFinger=-1; stick=Vector2.zero;}
  if(!foundLook){lookFinger=-1; look=Vector2.zero;}
 }
 public void SetQuality(string preset){
  Quality=preset; bool low=preset=="LOW", high=preset=="HIGH"; FpsTarget=high?60:30; Application.targetFrameRate=FpsTarget;
  QualitySettings.lodBias=low?.6f:high?1.5f:1f;
  QualitySettings.shadowDistance=low?12:high?40:24;
  QualitySettings.shadows=low?UnityEngine.ShadowQuality.HardOnly:UnityEngine.ShadowQuality.All;
  QualitySettings.shadowResolution=low?UnityEngine.ShadowResolution.Low:high?UnityEngine.ShadowResolution.High:UnityEngine.ShadowResolution.Medium;
  if(pipeline!=null){pipeline.renderScale=low?.7f:high?1f:.85f; pipeline.shadowDistance=low?12:high?40:24; pipeline.mainLightShadowmapResolution=low?512:high?2048:1024;}
  if(portalFx!=null){var main=portalFx.main; main.maxParticles=low?8:high?48:24; var e=portalFx.emission; e.rateOverTime=low?3:high?20:10;}
 }
 void OnGUI(){
  float scale=Mathf.Max(1,Screen.height/720f); GUI.matrix=Matrix4x4.Scale(Vector3.one*scale);
  float w=Screen.width/scale,h=Screen.height/scale;
  GUI.Box(new Rect(12,12,w-24,110),"SYSTEM WORLD FOUNDATION | "+MotionState+" | "+Quality+" target "+FpsTarget+" FPS");
  GUI.Label(new Rect(25,40,w-50,25),directive);
  GUI.Label(new Rect(25,68,w-50,25),Bridge!=null?Bridge.Status:"");
  GUI.Label(new Rect(25,94,w-50,24),"Left thumb: move (outer edge = run). Right thumb: camera. Desktop: WASD + RMB, E = portal.");
  string[] presets={"LOW","MEDIUM","HIGH"};
  for(int i=0;i<3;i++)if(GUI.Button(new Rect(16+i*104,132,100,38),presets[i])){auto=false; SetQuality(presets[i]); Bridge.Command("SET_QUALITY",presets[i]);}
  if(NearPortal&&GUI.Button(new Rect(w-190,h-90,175,60),"PORTAL / QUESTS"))InteractPortal();
  GUI.Box(new Rect(35,h-170,130,130),"MOVE"); GUI.Box(new Rect(w-165,h-170,130,65),"LOOK");
 }
 void OnDestroy(){
  if(pipeline!=null){pipeline.renderScale=originalScale; pipeline.shadowDistance=originalShadowDistance; pipeline.mainLightShadowmapResolution=originalShadowMap;}
  foreach(var material in materials)Destroy(material);
  if(Bridge!=null){Bridge.Message-=OnMessage; Destroy(Bridge.gameObject);}
 }
}
}
