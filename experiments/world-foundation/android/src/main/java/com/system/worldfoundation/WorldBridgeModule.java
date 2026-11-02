package com.system.worldfoundation;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
/** Legacy-module interop supported by RN New Architecture; register WorldBridgePackage in experimental host only. */
public final class WorldBridgeModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
 public WorldBridgeModule(ReactApplicationContext context) { super(context); context.addLifecycleEventListener(this); }
 @Override public String getName() { return "SystemWorldBridge"; }
 @ReactMethod public void addListener(String name) {}
 @ReactMethod public void removeListeners(double count) {}
 private void bind() { WorldBridge.listen(new WorldBridge.Listener() {
  public void message(String json) { emit("WorldMessage", json); }
  public void lifecycle(String state) { emit("WorldLifecycle", state); }
 }); }
 private void emit(String name, String value) { ReactApplicationContext c = getReactApplicationContext(); if (c.hasActiveReactInstance()) c.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(name,value); }
 @ReactMethod public void launch(String init, Promise result) { getReactApplicationContext().runOnUiQueueThread(() -> { try { bind(); android.app.Activity host = getCurrentActivity(); if (host == null) throw new IllegalStateException("HOST_UNAVAILABLE"); WorldBridge.start(host, init); result.resolve(null); } catch(Exception e) { result.reject("WORLD_LAUNCH", e.getMessage()); } }); }
 @ReactMethod public void send(String json, Promise result) { try { WorldBridge.send(json); result.resolve(null); } catch(Exception e) { result.reject("WORLD_SEND", e.getMessage()); } }
 @ReactMethod public void returnToHost() { getReactApplicationContext().runOnUiQueueThread(WorldBridge::returnToHost); }
 @ReactMethod public void dispose() { getReactApplicationContext().runOnUiQueueThread(WorldBridge::dispose); }
 @Override public void onHostResume() { }
 @Override public void onHostPause() { }
 @Override public void onHostDestroy() { WorldBridge.dispose(); }
 @Override public void invalidate() { getReactApplicationContext().runOnUiQueueThread(() -> { WorldBridge.dispose(); WorldBridge.listen(null); }); getReactApplicationContext().removeLifecycleEventListener(this); super.invalidate(); }
}

