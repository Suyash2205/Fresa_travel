import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEmail, normalizePhone, pickFirstSeenTraveller } from "./matchTraveller";

test("normalizeEmail lowercases and trims", () => {
  assert.equal(normalizeEmail("  TEST@Example.Com "), "test@example.com");
  assert.equal(normalizeEmail(undefined), null);
});

test("normalizePhone strips punctuation and country code", () => {
  assert.equal(normalizePhone("+91 98765-43210"), "9876543210");
  assert.equal(normalizePhone("(987) 654-3210"), "9876543210");
  assert.equal(normalizePhone(undefined), null);
});

test("pickFirstSeenTraveller enforces first-agent-wins rule", () => {
  const early = { firstSeenAt: new Date("2026-01-01") };
  const late = { firstSeenAt: new Date("2026-02-01") };
  assert.equal(pickFirstSeenTraveller(early, late), early);
});
