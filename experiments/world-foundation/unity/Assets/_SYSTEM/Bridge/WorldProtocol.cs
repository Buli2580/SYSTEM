using System;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
namespace SystemWorld {
[Serializable] public sealed class WorldEnvelope { public string protocolVersion,type,messageId,timestamp,playerId,sessionId; public int profileGeneration,stateRevision; public JObject payload; }
public static class WorldCodec {
 public const string Version="SYSTEM_WORLD_BRIDGE_V1";
 static readonly Regex Id=new Regex(@"^[A-Za-z0-9_.:-]{1,96}$");
 public static bool IsId(string s)=>s!=null&&Id.IsMatch(s);
 static void Require(bool ok){if(!ok)throw new FormatException("Invalid WORLD message");}
 static void Keys(JObject o,params string[] names){Require(o!=null&&o.Properties().Select(p=>p.Name).OrderBy(x=>x).SequenceEqual(names.OrderBy(x=>x)));}
 static void Text(JToken t,int max){Require(t!=null&&t.Type==JTokenType.String&&t.Value<string>().Length<=max);var value=t.Value<string>();new UTF8Encoding(false,true).GetByteCount(value);Require(!Regex.IsMatch(value,@"[\u0000-\u0008\u000B\u000C\u000E-\u001F]"));}
 static void Ident(JToken t){Require(t!=null&&t.Type==JTokenType.String&&IsId(t.Value<string>()));}
 static void Num(JToken t,int min){Require(t!=null&&(t.Type==JTokenType.Integer||t.Type==JTokenType.Float));double value=t.Value<double>();Require(!double.IsNaN(value)&&!double.IsInfinity(value)&&value>=min&&value<=int.MaxValue&&Math.Floor(value)==value);}
 static void Choice(JToken t,params string[] values){Require(t!=null&&t.Type==JTokenType.String&&values.Contains(t.Value<string>()));}
 public static WorldEnvelope Decode(string json,bool fromHost){
 Require(json!=null&&new UTF8Encoding(false,true).GetByteCount(json)<=16384);
 StrictJson.Validate(json);JObject o; using(var sr=new System.IO.StringReader(json))using(var r=new JsonTextReader(sr){DateParseHandling=DateParseHandling.None,MaxDepth=32}){o=JObject.Load(r,new JsonLoadSettings{DuplicatePropertyNameHandling=DuplicatePropertyNameHandling.Error});Require(!r.Read());}
 Keys(o,"protocolVersion","type","messageId","timestamp","playerId","profileGeneration","sessionId","stateRevision","payload");
 Choice(o["protocolVersion"],Version);Ident(o["messageId"]);Ident(o["playerId"]);Ident(o["sessionId"]);Num(o["profileGeneration"],0);Num(o["stateRevision"],0);
 Text(o["timestamp"],40);Require(Regex.IsMatch(o["timestamp"].Value<string>(),@"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$")&&DateTimeOffset.TryParseExact(o["timestamp"].Value<string>(),"yyyy-MM-dd\'T\'HH:mm:ss.fff\'Z\'",System.Globalization.CultureInfo.InvariantCulture,System.Globalization.DateTimeStyles.AssumeUniversal,out _));
 Text(o["type"],40);var type=o["type"].Value<string>();Require(fromHost?type!="WORLD_COMMAND":type=="WORLD_COMMAND");var p=o["payload"] as JObject;Require(p!=null);
 switch(type){
 case "WORLD_INIT":Keys(p,"hostBuildSha","quality");Text(p["hostBuildSha"],40);Require(Regex.IsMatch(p["hostBuildSha"].Value<string>(),"^[a-f0-9]{40}$"));Choice(p["quality"],"LOW","MEDIUM","HIGH");break;
 case "WORLD_SNAPSHOT":Keys(p,"displayName","realLevel","realXp","skills","equippedItemIds","domainLevel","activeQuestId");Text(p["displayName"],80);Num(p["realLevel"],1);Num(p["realXp"],0);Num(p["domainLevel"],1);var skills=p["skills"] as JObject;Keys(skills,"STR","VIT","INT","WIL","CHA","CRE","RES");foreach(var v in skills.Properties())Num(v.Value,1);Require(p["equippedItemIds"] is JArray a&&a.Count<=12);foreach(var v in (JArray)p["equippedItemIds"])Ident(v);Require(((JArray)p["equippedItemIds"]).Select(x=>(string)x).Distinct().Count()==((JArray)p["equippedItemIds"]).Count);if(p["activeQuestId"].Type!=JTokenType.Null)Ident(p["activeQuestId"]);break;
 case "WORLD_DIRECTIVE":Keys(p,"mode","message");Choice(p["mode"],"NORMAL","RECOVERY","VICTORY","THREAT");Text(p["message"],240);break;
 case "WORLD_COMMAND":Choice(p["action"],"REQUEST_SNAPSHOT","OPEN_PANEL","SET_QUALITY");var action=p["action"].Value<string>();Keys(p,action=="OPEN_PANEL"?new[]{"commandId","expectedRevision","activeSessionId","action","panel"}:action=="SET_QUALITY"?new[]{"commandId","expectedRevision","activeSessionId","action","quality"}:new[]{"commandId","expectedRevision","activeSessionId","action"});Ident(p["commandId"]);Ident(p["activeSessionId"]);Num(p["expectedRevision"],0);Require((string)p["activeSessionId"]==(string)o["sessionId"]);if(action=="OPEN_PANEL")Choice(p["panel"],"QUESTS","CHARACTER","INVENTORY");if(action=="SET_QUALITY")Choice(p["quality"],"LOW","MEDIUM","HIGH");break;
 case "WORLD_COMMAND_ACK":Keys(p,"commandId","result");Ident(p["commandId"]);Choice(p["result"],"APPLIED");break;
 case "WORLD_COMMAND_REJECT":Keys(p,"commandId","code");Ident(p["commandId"]);Choice(p["code"],"INVALID_MESSAGE","STALE_SESSION","STALE_REVISION","REPLAY_CONFLICT","IN_DOUBT","TIMEOUT","HOST_ERROR","DISPOSED","PAUSED");break;
 case "WORLD_PAUSE":case "WORLD_RESUME":case "WORLD_DISPOSE":Keys(p,"reason");Choice(p["reason"],"USER","BACKGROUND","ACCOUNT_CHANGE","TIMEOUT");break;
 default:throw new FormatException("Unknown message type");}
 return o.ToObject<WorldEnvelope>();
 }
 public static string Encode(WorldEnvelope e,bool fromHost){var s=JsonConvert.SerializeObject(e);Decode(s,fromHost);return s;}
}
}
