using System;
using System.Collections;
using System.IO;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using SystemWorld;
public class RecorderPlayTests {
 [UnityTest]public IEnumerator RecorderFormatIsPortableAndFilesArePreserved(){var go=new GameObject("recorder test");var recorder=go.AddComponent<WorldFrameRecorder>();var path=Path.Combine(Application.temporaryCachePath,"world-recorder-contract-"+Guid.NewGuid().ToString("N")+".jsonl");Assert.Throws<ArgumentException>(()=>recorder.Begin(path,"restart","android-physical","LOW",new string('a',40),"CONTRACT TEST ONLY"));recorder.Begin(path,"restart","desktop","LOW",new string('a',40),"CONTRACT TEST ONLY; null graphics Editor; not device benchmark");yield return null;yield return null;recorder.End();var original=File.ReadAllText(path);var lines=File.ReadAllLines(path);Assert.GreaterOrEqual(lines.Length,3);foreach(var line in lines){var o=JObject.Load(new Newtonsoft.Json.JsonTextReader(new StringReader(line)){DateParseHandling=Newtonsoft.Json.DateParseHandling.None});var stamp=(string)(o["timestamp"]??o["startedAt"]??o["endedAt"]);StringAssert.IsMatch(@"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$",stamp);}Assert.Throws<IOException>(()=>recorder.Begin(path,"restart","desktop","LOW",new string('a',40),"CONTRACT TEST ONLY"));Assert.AreEqual(original,File.ReadAllText(path));Debug.Log("WORLD_RECORDER_TEST_OUTPUT: "+path);UnityEngine.Object.Destroy(go);yield return null;}
}
