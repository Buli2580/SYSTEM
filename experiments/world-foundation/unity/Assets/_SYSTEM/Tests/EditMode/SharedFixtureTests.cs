using System.IO;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using NUnit.Framework;
using SystemWorld;
public class SharedFixtureTests {
 [Test] public void AllV1MessagesRoundtrip(){var reader=new JsonTextReader(new StringReader(File.ReadAllText("Assets/_SYSTEM/Tests/EditMode/bridge-fixtures.json"))){DateParseHandling=DateParseHandling.None};var fixtures=JArray.Load(reader);Assert.AreEqual(11,fixtures.Count);foreach(var fixture in fixtures){var raw=fixture.ToString();bool host=(string)fixture["type"]!="WORLD_COMMAND";var decoded=WorldCodec.Decode(raw,host);Assert.True(JToken.DeepEquals(fixture,JToken.Load(new JsonTextReader(new StringReader(WorldCodec.Encode(decoded,host))){DateParseHandling=DateParseHandling.None})),decoded.type);}}
}
