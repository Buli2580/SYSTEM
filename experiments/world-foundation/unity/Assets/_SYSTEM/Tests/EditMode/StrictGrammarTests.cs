using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using SystemWorld;
public class StrictGrammarTests {
 [Test] public void SharedNegativesRejected(){foreach(var raw in JArray.Parse(File.ReadAllText("Assets/_SYSTEM/Tests/EditMode/bridge-negative-fixtures.json")))Assert.Catch(()=>WorldCodec.Decode((string)raw,true));}
 [TestCase("2.0")][TestCase("2e0")]public void IntegralJsonNumbersMatchTypeScript(string number){var fixtures=JArray.Load(new JsonTextReader(new StringReader(File.ReadAllText("Assets/_SYSTEM/Tests/EditMode/bridge-fixtures.json"))){DateParseHandling=DateParseHandling.None});var raw=fixtures[0].ToString(Formatting.None).Replace("\"stateRevision\":2","\"stateRevision\":"+number);Assert.AreEqual(2,WorldCodec.Decode(raw,true).stateRevision);}
}
