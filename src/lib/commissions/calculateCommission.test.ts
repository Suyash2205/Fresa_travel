import assert from "node:assert/strict";
import test from "node:test";

import { calculateCommission } from "./calculateCommission";

test("calculateCommission returns 5% of subtotal", () => {
  assert.equal(calculateCommission(1000), 50);
  assert.equal(calculateCommission(2999), 149.95);
});

test("calculateCommission never returns negative values", () => {
  assert.equal(calculateCommission(-200), 0);
});
