using System;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace SystemWorld {
public sealed class WorldBridgeClient:MonoBehaviour {
 public WorldEnvelope Active{get;private set;} public string Status{get;private set;}="Offline TEMP preview — host not connected";
 public bool Paused{get;private set;} public bool Disposed{get;private set;}
 string initializedSession; public event Action<WorldEnvelope> Message; public event Action<WorldEnvelope> CommandPrepared;
 public void Receive(string json){try{Accept(WorldCodec.Decode(json,true));}catch(Exception){Status="Rejected invalid host message";}}
 public void Accept(WorldEnvelope e){WorldCodec.Encode(e,true);
 if(e.type=="WORLD_INIT") {if(Active!=null&&!Disposed&&e.stateRevision<Active.stateRevision)throw new FormatException("Stale init revision");if(Active!=null&&!Disposed&&(e.playerId!=Active.playerId||e.sessionId!=Active.sessionId||e.profileGeneration!=Active.profileGeneration))throw new FormatException("Dispose before account replacement");Active=e;Disposed=false;Paused=false;}
 else {if(Active==null||Disposed||e.playerId!=Active.playerId||e.sessionId!=Active.sessionId||e.profileGeneration!=Active.profileGeneration||e.stateRevision<Active.stateRevision)throw new FormatException("Stale identity/session/revision");Active=e;}
 if(e.type=="WORLD_PAUSE")Paused=true;if(e.type=="WORLD_RESUME")Paused=false;if(e.type=="WORLD_DISPOSE"){Disposed=true;Paused=true;initializedSession=null;}
 Status=e.type+" revision "+e.stateRevision;Message?.Invoke(e);if(e.type=="WORLD_INIT"&&initializedSession!=e.sessionId){initializedSession=e.sessionId;Command("REQUEST_SNAPSHOT");}
 }
 public bool Command(string action,string value=null){if(Active==null||Paused||Disposed)return false;var id=Guid.NewGuid().ToString("N");var p=new JObject{{"commandId",id},{"expectedRevision",Active.stateRevision},{"activeSessionId",Active.sessionId},{"action",action}};if(action=="OPEN_PANEL")p["panel"]=value;if(action=="SET_QUALITY")p["quality"]=value;
 var e=new WorldEnvelope{protocolVersion=WorldCodec.Version,type="WORLD_COMMAND",messageId=id,timestamp=DateTime.UtcNow.ToString("yyyy-MM-dd\'T\'HH:mm:ss.fff\'Z\'"),playerId=Active.playerId,profileGeneration=Active.profileGeneration,sessionId=Active.sessionId,stateRevision=Active.stateRevision,payload=p};var json=WorldCodec.Encode(e,false);CommandPrepared?.Invoke(e);
#if UNITY_ANDROID && !UNITY_EDITOR
 using(var bridge=new AndroidJavaClass("com.system.worldfoundation.WorldBridge"))bridge.CallStatic("emit",json);
#else
 Debug.Log("WORLD command prepared (desktop transport unavailable): "+action);
#endif
 return true;}
}
}
