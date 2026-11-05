import assert from "node:assert/strict";
import test from "node:test";

import {
  getJayShakthiOrderFormSlots,
  getJayShakthiOrderFormUrl,
  getOrderFormPostStatus,
  parseJayShakthiOrderFormSlots,
} from "../app/_lib/order-form-slots.ts";

test("finds a Jay Shakthi order form in a WhatsApp-style Markdown message", () => {
  const description = "📝 *Order Form:* [**Open**](https://deal.jayshakthimarketing.com/orderform?product_code=Unigen_WiFiDongle5g_Az\\&deal_type_id=7079\\&mediator_name=Samarth)";

  assert.equal(
    getJayShakthiOrderFormUrl(description),
    "https://deal.jayshakthimarketing.com/orderform?product_code=Unigen_WiFiDongle5g_Az&deal_type_id=7079&mediator_name=Samarth",
  );
});

test("rejects non-Jay-Shakthi URLs so a description cannot choose the server fetch target", () => {
  assert.equal(getJayShakthiOrderFormUrl("https://example.com/orderform?deal_type_id=7079"), null);
  assert.equal(getJayShakthiOrderFormUrl("https://docs.google.com/forms/d/e/example/viewform"), null);
});

test("reads deal types and counts from the order-form availability message", () => {
  assert.deepEqual(
    parseJayShakthiOrderFormSlots("<p><strong>Deal found!</strong> Available Slots: <b>Review</b>: 1 &nbsp; Rating: 0</p>"),
    [
      { dealType: "Review", availableSlots: 1 },
      { dealType: "Rating", availableSlots: 0 },
    ],
  );
});

test("reads the live slot data embedded in a Jay Shakthi order form", () => {
  const html = '<option value="Unigen_WiFiDongle5g_Az" data-available-deals=\'[{&quot;type_name&quot;:&quot;Review&quot;,&quot;remaining&quot;:1},{&quot;type_name&quot;:&quot;Rating&quot;,&quot;remaining&quot;:0}]\'>';

  assert.deepEqual(
    parseJayShakthiOrderFormSlots(html, "Unigen_WiFiDongle5g_Az"),
    [
      { dealType: "Review", availableSlots: 1 },
      { dealType: "Rating", availableSlots: 0 },
    ],
  );
});

test("treats a confirmed empty product deal list as over without using unrelated slot totals", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      '<option value="Product_A" data-available-deals="[]"></option><p>Available Slots: Review: 5</p>',
      { status: 200 },
    );

  try {
    const availability = await getJayShakthiOrderFormSlots(
      "https://deal.jayshakthimarketing.com/orderform?product_code=Product_A",
    );

    assert.deepEqual(availability?.slots, []);
    assert.equal(getOrderFormPostStatus(availability), "over");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not use unrelated slot totals when the requested product is missing", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      '<option value="Another_Product" data-available-deals="[{&quot;type_name&quot;:&quot;Review&quot;,&quot;remaining&quot;:5}]"></option><p>Available Slots: Review: 5</p>',
      { status: 200 },
    );

  try {
    const availability = await getJayShakthiOrderFormSlots(
      "https://deal.jayshakthimarketing.com/orderform?product_code=Product_A",
    );

    assert.equal(availability, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("treats malformed product slot data as unverified instead of sold out", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      '<option value="Product_A" data-available-deals=\'[{&quot;type_name&quot;:&quot;Review&quot;,&quot;remaining&quot;:0},{&quot;type_name&quot;:&quot;Rating&quot;,&quot;remaining&quot;:&quot;&quot;}]\'>',
      { status: 200 },
    );

  try {
    const availability = await getJayShakthiOrderFormSlots(
      "https://deal.jayshakthimarketing.com/orderform?product_code=Product_A",
    );

    assert.equal(availability, null);
    assert.equal(getOrderFormPostStatus(availability), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps slot counts and status identical across ten unchanged-source checks", async () => {
  const originalFetch = globalThis.fetch;
  const response =
    '<option value="Product_A" data-available-deals=\'[{&quot;type_name&quot;:&quot;Review&quot;,&quot;remaining&quot;:5}]\'></option>';
  globalThis.fetch = async () => new Response(response, { status: 200 });

  try {
    const checks = [];
    for (let index = 0; index < 10; index += 1) {
      checks.push(
        await getJayShakthiOrderFormSlots(
          "https://deal.jayshakthimarketing.com/orderform?product_code=Product_A",
        ),
      );
    }

    assert.deepEqual(
      checks.map((availability) => ({
        slots: availability?.slots,
        status: getOrderFormPostStatus(availability),
      })),
      Array.from({ length: 10 }, () => ({
        slots: [{ dealType: "Review", availableSlots: 5 }],
        status: "live",
      })),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves an unknown status when the source request fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Temporary source outage");
  };

  try {
    const availability = await getJayShakthiOrderFormSlots(
      "https://deal.jayshakthimarketing.com/orderform?product_code=Product_A",
    );
    assert.equal(availability, null);
    assert.equal(getOrderFormPostStatus(availability), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("parses slot counts consistently and rejects empty or malformed counts", () => {
  assert.deepEqual(
    parseJayShakthiOrderFormSlots(
      '<option value="Product_A" data-available-deals=\'[{&quot;type_name&quot;:&quot;Review&quot;,&quot;remaining&quot;:&quot;5&quot;}]\'></option>',
      "Product_A",
    ),
    [{ dealType: "Review", availableSlots: 5 }],
  );
  assert.deepEqual(
    parseJayShakthiOrderFormSlots(
      '<option value="Product_A" data-available-deals=\'[{&quot;type_name&quot;:&quot;Review&quot;,&quot;remaining&quot;:&quot; &quot;}]\'></option>',
      "Product_A",
    ),
    [],
  );
});

test("chooses LIVE if any deal type still has slots", () => {
  assert.equal(
    getOrderFormPostStatus({
      formUrl: "https://deal.jayshakthimarketing.com/orderform",
      slots: [
        { dealType: "Review", availableSlots: 0 },
        { dealType: "Rating", availableSlots: 2 },
      ],
    }),
    "live",
  );
});

test("chooses LIVE for one or more verified slots and OVER for exactly zero", () => {
  const availability = (availableSlots) => ({
    formUrl: "https://deal.jayshakthimarketing.com/orderform",
    slots: [{ dealType: "Review", availableSlots }],
  });

  assert.equal(getOrderFormPostStatus(availability(5)), "live");
  assert.equal(getOrderFormPostStatus(availability(1)), "live");
  assert.equal(getOrderFormPostStatus(availability(0)), "over");
});

test("chooses OVER only when every deal type is sold out", () => {
  assert.equal(
    getOrderFormPostStatus({
      formUrl: "https://deal.jayshakthimarketing.com/orderform",
      slots: [
        { dealType: "Review", availableSlots: 0 },
        { dealType: "Rating", availableSlots: 0 },
      ],
    }),
    "over",
  );
  assert.equal(getOrderFormPostStatus(null), null);
  assert.equal(
    getOrderFormPostStatus({
      formUrl: "https://deal.jayshakthimarketing.com/orderform",
      slots: [],
    }),
    "over",
  );
});
