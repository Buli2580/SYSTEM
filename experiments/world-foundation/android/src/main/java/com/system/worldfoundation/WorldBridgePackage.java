package com.system.worldfoundation;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.*;
import com.facebook.react.uimanager.ViewManager;
import java.util.*;
public final class WorldBridgePackage implements ReactPackage {
 public List<NativeModule> createNativeModules(ReactApplicationContext context) { return Collections.singletonList(new WorldBridgeModule(context)); }
 public List<ViewManager> createViewManagers(ReactApplicationContext context) { return Collections.emptyList(); }
}
