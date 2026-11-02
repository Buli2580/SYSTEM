using System;
using NUnit.Framework;
using Newtonsoft.Json.Linq;
using SystemWorld;
using UnityEngine;
public class WorldCodecTests {
 static WorldEnvelope Init()=>new WorldEnvelope{protocolVersion=WorldCodec.Version,type="WORLD_INIT",messageId="msg1",timestamp="2026-11-02T10:00:00.000Z",playerId="p1",profileGeneration=0,sessionId="s1",stateRevision=0,payload=new JObject{{"hostBuildSha",new string('a',40)},{"quality","LOW"}}};
 [Test] public void StaleInitCannotRollback(){var g=new GameObject();var c=g.AddComponent<WorldBridgeClient>();var e=Init();e.stateRevision=4;c.Accept(e);Assert.Throws<FormatException>(()=>c.Accept(Init()));Assert.AreEqual(4,c.Active.stateRevision);UnityEngine.Object.DestroyImmediate(g);}
 [Test] public void DisposedIdentityRequestsFreshSnapshotEvenWithReusedSession(){var g=new GameObject();var c=g.AddComponent<WorldBridgeClient>();int count=0;c.CommandPrepared+=_=>count++;c.Accept(Init());var e=Init();e.type="WORLD_DISPOSE";e.messageId="dispose1";e.payload=new JObject{{"reason","ACCOUNT_CHANGE"}};c.Accept(e);e=Init();e.playerId="p2";e.profileGeneration=1;c.Accept(e);Assert.AreEqual(2,count);UnityEngine.Object.DestroyImmediate(g);}
 [Test] public void Roundtrip(){var e=Init();Assert.AreEqual(e.sessionId,WorldCodec.Decode(WorldCodec.Encode(e,true),true).sessionId);}
 [Test] public void VersionMismatch(){var e=Init();e.protocolVersion="2";Assert.Throws<FormatException>(()=>WorldCodec.Encode(e,true));}
 [Test] public void UnknownPayloadRejected(){var e=Init();e.payload["reward"]=1;Assert.Throws<FormatException>(()=>WorldCodec.Encode(e,true));}
 [Test] public void SizeRejected(){Assert.Throws<FormatException>(()=>WorldCodec.Decode(new string(' ',16385),true));}
 [Test] public void WrongDirection(){Assert.Throws<FormatException>(()=>WorldCodec.Encode(Init(),false));}
 [Test] public void DuplicateKeys(){var s=WorldCodec.Encode(Init(),true).Replace("\"quality\":\"LOW\"","\"quality\":\"LOW\",\"quality\":\"HIGH\"");Assert.Throws<Newtonsoft.Json.JsonReaderException>(()=>WorldCodec.Decode(s,true));}
 [Test] public void StaleSessionRejected(){var g=new GameObject();var c=g.AddComponent<WorldBridgeClient>();c.Accept(Init());var e=Init();e.type="WORLD_PAUSE";e.sessionId="stale";e.payload=new JObject{{"reason","USER"}};Assert.Throws<FormatException>(()=>c.Accept(e));UnityEngine.Object.DestroyImmediate(g);}
 [Test] public void PausedCannotCommand(){var g=new GameObject();var c=g.AddComponent<WorldBridgeClient>();c.Accept(Init());var e=Init();e.type="WORLD_PAUSE";e.payload=new JObject{{"reason","USER"}};c.Accept(e);Assert.False(c.Command("REQUEST_SNAPSHOT"));UnityEngine.Object.DestroyImmediate(g);}
}
