package com.system.worldfoundation;
import android.os.Bundle;
import com.unity3d.player.UnityPlayerActivity;
public final class WorldUnityActivity extends UnityPlayerActivity {
 @Override protected void onCreate(Bundle state) {
  WorldBridge.attach(this); super.onCreate(state);
  // A process recreation must request fresh RN state; never restore a persisted account snapshot.
  WorldBridge.state(state == null ? "CREATED" : "RESTART_REQUIRES_INIT");
 }
 @Override protected void onPause() { super.onPause(); WorldBridge.state("PAUSED"); }
 @Override protected void onResume() { super.onResume(); WorldBridge.state("RESUMED"); }
 @Override public boolean dispatchKeyEvent(android.view.KeyEvent event) { if (event.getKeyCode() == android.view.KeyEvent.KEYCODE_BACK) { if (event.getAction() == android.view.KeyEvent.ACTION_UP) WorldBridge.returnToHost(); return true; } return super.dispatchKeyEvent(event); }
 @Override public void onBackPressed() { WorldBridge.returnToHost(); } @Override public void onUnityPlayerUnloaded() { finish(); }
 
 @Override protected void onDestroy() {
  // UnityPlayerActivity destroys the runtime; no UnityPlayer.quit/System.exit from host.
  WorldBridge.detach(this); WorldBridge.state("RETURNED"); super.onDestroy();
 }
}



