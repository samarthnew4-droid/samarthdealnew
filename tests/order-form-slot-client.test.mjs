import assert from "node:assert/strict";
import test from "node:test";

import { loadOrderFormSlots } from "../app/_lib/order-form-slot-client.ts";

test("deduplicates concurrent requests without caching later checks", async () => {
  const originalFetch = globalThis.fetch;
  const formUrl = "https://deal.jayshakthimarketing.com/orderform?product_code=Dedup_Test";
  let fetchCount = 0;
  let releaseResponse;
  const responseGate = new Promise((resolve) => {
    releaseResponse = resolve;
  });
  globalThis.fetch = async () => {
    fetchCount += 1;
    await responseGate;
    return Response.json({
      slots: {
        formUrl,
        slots: [{ dealType: "Review", availableSlots: 5 }],
      },
    });
  };

  try {
    const first = loadOrderFormSlots(formUrl);
    const second = loadOrderFormSlots(formUrl);
    releaseResponse();

    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.deepEqual(firstResult, secondResult);
    assert.equal(fetchCount, 1);

    await loadOrderFormSlots(formUrl);
    assert.equal(fetchCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not accept an invalid API slot response", async () => {
  const originalFetch = globalThis.fetch;
  const formUrl = "https://deal.jayshakthimarketing.com/orderform?product_code=Invalid_Test";
  globalThis.fetch = async () =>
    Response.json({
      slots: {
        formUrl,
        slots: [{ dealType: "Review", availableSlots: "" }],
      },
    });

  try {
    assert.equal(await loadOrderFormSlots(formUrl), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
