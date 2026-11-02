using System;
using Newtonsoft.Json;
namespace SystemWorld {
[Serializable] public sealed class WorldInitPayload {public string hostBuildSha,quality;}
[Serializable] public sealed class WorldSkills {public int STR,VIT,INT,WIL,CHA,CRE,RES;}
[Serializable] public sealed class WorldSnapshotPayload {public string displayName;public int realLevel,realXp,domainLevel;public WorldSkills skills;public string[] equippedItemIds;public string activeQuestId;}
[Serializable] public sealed class WorldDirectivePayload {public string mode,message;}
[Serializable] public sealed class WorldCommandPayload {public string commandId,activeSessionId,action;public int expectedRevision;[JsonProperty(NullValueHandling=NullValueHandling.Ignore)]public string panel;[JsonProperty(NullValueHandling=NullValueHandling.Ignore)]public string quality;}
[Serializable] public sealed class WorldAckPayload {public string commandId,result;}
[Serializable] public sealed class WorldRejectPayload {public string commandId,code;}
[Serializable] public sealed class WorldLifecyclePayload {public string reason;}
}
