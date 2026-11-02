using System;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;
using Unity.Profiling;
namespace SystemWorld {
public sealed class WorldFrameRecorder:MonoBehaviour {
 StreamWriter output; ProfilerRecorder main,render; int buffered;
 public void Begin(string path,string scenario,string platform,string preset,string buildSha,string conditions){
  End();
  if(!System.Text.RegularExpressions.Regex.IsMatch(buildSha??"","^[a-f0-9]{40}$"))throw new ArgumentException("Real build SHA required");
  bool android=!Application.isEditor&&Application.platform==RuntimePlatform.Android;
  if(android?(platform!="android-physical"&&platform!="android-emulator"):platform!="desktop")throw new ArgumentException("Platform must match runtime; Android emulator/physical is explicitly declared");
  if(!System.Array.Exists(new[]{"idle5min","tps10min","enterexit10","continuous15min","restart"},x=>x==scenario)||!System.Array.Exists(new[]{"LOW","MEDIUM","HIGH"},x=>x==preset))throw new ArgumentException("Unknown benchmark scenario/preset");
  output=new StreamWriter(new FileStream(path,FileMode.CreateNew,FileAccess.Write,FileShare.Read));
  output.WriteLine(JsonConvert.SerializeObject(new {type="metadata",schemaVersion=1,scenario,platform,device=SystemInfo.deviceModel,os=SystemInfo.operatingSystem,preset,buildSha,conditions,startedAt=DateTime.UtcNow.ToString("yyyy-MM-dd\'T\'HH:mm:ss.fff\'Z\'")}));
  main=ProfilerRecorder.StartNew(ProfilerCategory.Internal,"Main Thread",1);
  render=ProfilerRecorder.StartNew(ProfilerCategory.Internal,"Render Thread",1);
 }
 void LateUpdate(){if(output==null)return;output.WriteLine(JsonConvert.SerializeObject(new{type="frame",timestamp=DateTime.UtcNow.ToString("yyyy-MM-dd\'T\'HH:mm:ss.fff\'Z\'"),frameMs=Time.unscaledDeltaTime*1000,cpuMainMs=main.Valid?(double?)main.LastValue/1000000:null,cpuRenderMs=render.Valid?(double?)render.LastValue/1000000:null,gpuMs=(double?)null}));if(++buffered%120==0)output.Flush();}
 public void End(){if(output==null)return;output.WriteLine(JsonConvert.SerializeObject(new{type="end",endedAt=DateTime.UtcNow.ToString("yyyy-MM-dd\'T\'HH:mm:ss.fff\'Z\'")}));output.Dispose();output=null;main.Dispose();render.Dispose();}
 void OnApplicationPause(bool pause){if(pause)output?.Flush();}void OnDestroy(){End();}
}
}
