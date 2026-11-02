package com.system.worldfoundation;
import java.nio.charset.StandardCharsets;
final class BridgeGate {
 private boolean active, ready; private long transportGeneration; synchronized long attach() { ready = false; return ++transportGeneration; } synchronized long generation() { return transportGeneration; } synchronized void markReady(long token) { if (token == transportGeneration) ready = true; } synchronized boolean isReady() { return ready; } synchronized void detach(long token) { if (token == transportGeneration) { transportGeneration++; active = false; ready = false; } }
 synchronized void activate() { active = true; }
 synchronized void close() { active = false; ready = false; transportGeneration++; }
 synchronized boolean accept(String message) {
  return active && message != null && message.length() <= 16384 && message.getBytes(StandardCharsets.UTF_8).length <= 16384;
 }
}

