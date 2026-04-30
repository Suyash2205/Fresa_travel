import assert from "node:assert/strict";
import test from "node:test";

import { normalizeStatementMonth } from "./statements";

test("normalizeStatementMonth maps dates to month start", () => {
  const value = normalizeStatementMonth(new Date("2026-04-18T13:45:00Z"));
  assert.equal(value.getDate(), 1);
  assert.equal(value.getMonth(), 3);
  assert.equal(value.getFullYear(), 2026);
});
