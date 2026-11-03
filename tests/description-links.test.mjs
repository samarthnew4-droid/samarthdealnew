import assert from "node:assert/strict";
import test from "node:test";

import { tokenizeDescription } from "../app/_lib/description-links.ts";

function linksIn(description) {
  return tokenizeDescription(description).filter((part) => part.kind === "link");
}

test("turns a plain https URL into one link", () => {
  assert.deepEqual(linksIn("Buy here https://example.com/item"), [
    { kind: "link", label: "https://example.com/item", url: "https://example.com/item", actionLabel: null },
  ]);
});

test("keeps multiple URLs in one description", () => {
  assert.equal(linksIn("A https://example.com/a and B https://example.com/b").length, 2);
});

test("renders Markdown links with their labels and URLs", () => {
  assert.deepEqual(linksIn("[Order Form](https://example.com/order)"), [
    { kind: "link", label: "Order Form", url: "https://example.com/order", actionLabel: "Open order form" },
  ]);
});

test("preserves line breaks and surrounding text", () => {
  assert.deepEqual(tokenizeDescription("First line\nSecond https://example.com\n*important*"), [
    { kind: "text", value: "First line\nSecond " },
    { kind: "link", label: "https://example.com", url: "https://example.com", actionLabel: null },
    { kind: "text", value: "\n*important*" },
  ]);
});

test("does not include punctuation after a URL", () => {
  assert.deepEqual(linksIn("Visit https://example.com/path."), [
    { kind: "link", label: "https://example.com/path", url: "https://example.com/path", actionLabel: null },
  ]);
});

test("ignores malicious and unsupported URL schemes", () => {
  assert.equal(linksIn("[Bad](javascript:alert(1)) javascript:alert(1)").length, 0);
});

test("returns a single text part when there are no links", () => {
  assert.deepEqual(tokenizeDescription("No links here."), [{ kind: "text", value: "No links here." }]);
});
