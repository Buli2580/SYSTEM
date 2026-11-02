package com.system.worldfoundation;
public final class BridgeGateTest {
 public static void main(String[] args) {
  BridgeGate gate = new BridgeGate();
  check(!gate.accept("hello"), "inactive must reject");
  gate.activate();
  check(gate.accept("hello"), "active must accept");
  check(!gate.accept("x".repeat(16385)), "size bounded"); check(!gate.accept("\u20ac".repeat(6000)), "UTF-8 byte bound"); check(!gate.accept(null), "null rejected");
  gate.close(); check(!gate.accept("hello"), "disposed must reject");
  gate.activate(); check(gate.accept("hello"), "new session must work");
  long old = gate.attach(); gate.markReady(old); check(gate.isReady(), "attached ready"); gate.detach(old); check(!gate.isReady() && !gate.accept("hello"), "detach invalidates transport"); gate.activate(); long fresh = gate.attach(); gate.markReady(old); check(!gate.isReady(), "stale ready ignored"); gate.markReady(fresh); gate.detach(old); check(gate.isReady(), "old detach cannot clear new activity"); gate.detach(fresh); check(!gate.isReady(), "fresh detach clears ready"); System.out.println("PASS BridgeGate lifecycle and UTF-8 bounds");
 }
 static void check(boolean value, String message) { if (!value) throw new AssertionError(message); }
}


