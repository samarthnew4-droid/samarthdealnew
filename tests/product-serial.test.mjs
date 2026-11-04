import assert from "node:assert/strict";
import test from "node:test";

import { assignMissingProductSerialNumbers } from "../app/_lib/product-serial.ts";

test("assigns available serial numbers to existing products by creation order", () => {
  const posts = [
    { id: "newest", created_at: "2026-03-03", serial_number: null },
    { id: "oldest", created_at: "2026-03-01", serial_number: null },
    { id: "middle", created_at: "2026-03-02", serial_number: null },
  ];

  assert.deepEqual(
    assignMissingProductSerialNumbers(posts).map(({ id, serial_number }) => [
      id,
      serial_number,
    ]),
    [
      ["newest", 3],
      ["oldest", 1],
      ["middle", 2],
    ],
  );
});

test("preserves existing serial numbers and fills the next available numbers", () => {
  const posts = [
    { id: "existing", created_at: "2026-03-01", serial_number: 2 },
    { id: "newer", created_at: "2026-03-03", serial_number: null },
    { id: "older", created_at: "2026-03-02", serial_number: null },
  ];

  assert.deepEqual(
    assignMissingProductSerialNumbers(posts).map(({ id, serial_number }) => [
      id,
      serial_number,
    ]),
    [
      ["existing", 2],
      ["newer", 3],
      ["older", 1],
    ],
  );
});