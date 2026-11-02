using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using SystemWorld;
public class SavedScenePlayTests {
 [UnityTest]public IEnumerator SavedWorldSceneBootstrapsAndUnloads(){yield return SceneManager.LoadSceneAsync("WORLD_FOUNDATION",LoadSceneMode.Additive);var scene=SceneManager.GetSceneByName("WORLD_FOUNDATION");Assert.IsTrue(scene.isLoaded);WorldFoundation world=null;foreach(var root in scene.GetRootGameObjects()){world=root.GetComponentInChildren<WorldFoundation>();if(world!=null)break;}Assert.NotNull(world,"Saved scene bootstrap must create renderer runtime in its own scene");Assert.NotNull(world.Motor);Assert.NotNull(world.GetComponentInChildren<Camera>());Assert.NotNull(world.transform.Find("Test terrain"));var rp=UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline;Assert.NotNull(rp);Assert.AreEqual("UnityEngine.Rendering.Universal.UniversalRenderPipelineAsset",rp.GetType().FullName);yield return SceneManager.UnloadSceneAsync(scene);Assert.True(world==null,"Scene unload must clean up owned runtime");}
}
