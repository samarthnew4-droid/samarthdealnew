import assert from "node:assert/strict";
import test from "node:test";

import { getJayShakthiOrderFormUrl, getOrderFormPostStatus, parseJayShakthiOrderFormSlots } from "../app/_lib/order-form-slots.ts";

test("finds a Jay Shakthi order form in a WhatsApp-style Markdown message", () => {
  const description = "📝 *Order Form:* [**Open**](https://deal.jayshakthimarketing.com/orderform?product_code=Unigen_WiFiDongle5g_Az\\&deal_type_id=7079\\&mediator_name=Samarth)";

  assert.equal(
    getJayShakthiOrderFormUrl(description),
    "https://deal.jayshakthimarketing.com/orderform?product_code=Unigen_WiFiDongle5g_Az&deal_type_id=7079&mediator_name=Samarth",
  );
});

test("rejects non-Jay-Shakthi URLs so a description cannot choose the server fetch target", () => {
  assert.equal(getJayShakthiOrderFormUrl("https://example.com/orderform?deal_type_id=7079"), null);
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
    null,
  );
});
