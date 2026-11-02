package com.system.worldfoundation;
import android.app.Activity;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import com.unity3d.player.UnityPlayer;
import java.lang.ref.WeakReference;
/** Bounded transport only. RN protocol codec remains authoritative. Never awards XP. */
public final class WorldBridge {
 private static final Handler MAIN = new Handler(Looper.getMainLooper());
 private static final BridgeGate GATE = new BridgeGate();
 private static WeakReference<WorldUnityActivity> activity = new WeakReference<>(null);
 private static volatile Listener listener;
 private static volatile String player, session, initial; private static long transportGeneration; private static volatile long epoch; private static WeakReference<Activity> hostActivity = new WeakReference<>(null);
 private static volatile int generation;
 public interface Listener { void message(String json); void lifecycle(String state); }
 static void listen(Listener value) { listener = value; }
 static void attach(WorldUnityActivity value) { activity = new WeakReference<>(value); transportGeneration = GATE.attach(); }
 static void detach(WorldUnityActivity value) { if (activity.get() == value) { activity.clear(); GATE.detach(transportGeneration); epoch++; initial = null; pending = false; } }
 static void start(Activity host, String init) throws Exception {
  JSONObject envelope = validate(init, "WORLD_INIT");
  hostActivity = new WeakReference<>(host);
  player = envelope.getString("playerId"); session = envelope.getString("sessionId"); generation = envelope.getInt("profileGeneration");
  epoch++; GATE.activate(); initial = init; if (activity.get() != null && GATE.isReady()) ready();
  host.startActivity(new Intent(host, WorldUnityActivity.class).addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
 }
 static JSONObject validate(String json, String expected) throws Exception {
  if (json == null || json.length() > 16384 || json.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 16384) throw new IllegalArgumentException("MESSAGE_SIZE");
  JSONObject value = new JSONObject(json);
  if (!"SYSTEM_WORLD_BRIDGE_V1".equals(value.getString("protocolVersion"))) throw new IllegalArgumentException("VERSION");
  if (expected != null && !expected.equals(value.getString("type"))) throw new IllegalArgumentException("DIRECTION");
  if (value.length() != 9) throw new IllegalArgumentException("ENVELOPE");
  value.getString("messageId"); value.getString("timestamp"); value.getInt("stateRevision"); value.getJSONObject("payload");
  value.getString("playerId"); value.getString("sessionId"); value.getInt("profileGeneration");
  return value;
 }
 static void send(String json) throws Exception {
  JSONObject value = validate(json, null);
  if (!java.util.Arrays.asList("WORLD_INIT","WORLD_SNAPSHOT","WORLD_DIRECTIVE","WORLD_COMMAND_ACK","WORLD_COMMAND_REJECT","WORLD_PAUSE","WORLD_RESUME","WORLD_DISPOSE").contains(value.getString("type"))) throw new IllegalArgumentException("DIRECTION");
  if (!GATE.isReady() || !GATE.accept(json) || !same(value)) throw new IllegalStateException("STALE_SESSION");
  synchronized(WorldBridge.class) { if (outbound >= 8) throw new IllegalStateException("QUEUE_FULL"); outbound++; } final long token = epoch; MAIN.post(() -> { try { if (token == epoch && GATE.isReady() && GATE.accept(json)) UnityPlayer.UnitySendMessage("SystemWorldBridge", "Receive", json); } finally { synchronized(WorldBridge.class) { outbound--; } } });
 }
 private static boolean same(JSONObject v) throws Exception { return player.equals(v.getString("playerId")) && session.equals(v.getString("sessionId")) && generation == v.getInt("profileGeneration"); }
 /** Called by Unity AndroidJavaClass. Queue is bounded to one scheduled message. */
 private static boolean pending; private static int outbound;
 public static synchronized void emit(String json) {
  try {
   JSONObject v = validate(json, "WORLD_COMMAND");
   if (!GATE.accept(json) || !same(v) || pending) return;
   pending = true; final long token = epoch;
   MAIN.post(() -> { synchronized(WorldBridge.class) { pending = false; } if (token == epoch && GATE.accept(json) && listener != null) listener.message(json); });
  } catch (Exception ignored) { /* Untrusted data never reaches RN. */ }
 }
 static void state(String value) { if (listener != null) listener.lifecycle(value); }
 public static void ready() { final long generation = GATE.generation(); MAIN.post(() -> { GATE.markReady(generation); if (GATE.isReady() && initial != null && GATE.accept(initial)) { UnityPlayer.UnitySendMessage("SystemWorldBridge", "Receive", initial); initial = null; } }); } static void returnToHost() { Activity host = hostActivity.get(); WorldUnityActivity value = activity.get(); if (value != null && host != null) { value.getUnityPlayerConnection().onPause(); value.startActivity(new Intent(value, host.getClass()).addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)); } }
 static void dispose() { epoch++; GATE.close(); player = null; session = null; generation = -1; initial = null; returnToHost(); WorldUnityActivity v = activity.get(); if (v != null) v.getUnityPlayerConnection().unload(); }
 private WorldBridge() {}
}





