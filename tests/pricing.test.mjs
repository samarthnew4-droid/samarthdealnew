import assert from "node:assert/strict";
import test from "node:test";

import { numericPrice, savingsPercentage } from "../app/_lib/pricing.ts";

test("supports both prices and calculates a valid savings percentage", () => {
  assert.equal(numericPrice("11999"), 11999);
  assert.equal(numericPrice("3699"), 3699);
  assert.equal(savingsPercentage("11999", "3699")?.toFixed(1), "30.8");
});

test("supports a less price without inventing an order price", () => {
  assert.equal(numericPrice(null), null);
  assert.equal(numericPrice("219"), 219);
});

test("supports an order price without inventing a savings value", () => {
  assert.equal(numericPrice(999), 999);
  assert.equal(savingsPercentage(999, null), null);
});

test("returns no prices for missing, empty, or NaN values", () => {
  assert.equal(numericPrice(null), null);
  assert.equal(numericPrice(undefined), null);
  assert.equal(numericPrice(""), null);
  assert.equal(numericPrice("   "), null);
  assert.equal(numericPrice("NaN"), null);
  assert.equal(savingsPercentage(null, null), null);
});

test("preserves a genuine numeric zero", () => {
  assert.equal(numericPrice(0), 0);
  assert.equal(numericPrice("0"), 0);
  assert.equal(savingsPercentage(100, 0), 0);
});
