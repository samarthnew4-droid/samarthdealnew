import assert from "node:assert/strict";
import test from "node:test";

import { getDealActions, extractDealInformation } from "../app/_lib/deal-detail.ts";

const firstCryDescription = `Deal Type: Review
Product Code: BAYBEE_Bedside_Crib_fc
Brand Name: Dom
Platform: FirstCry
Order Link: https://bitli.in/QyeGq8Q
Mediator Name: Samarth
Order Form:
https://deal.jayshakthimarketing.com/orderform?product_code=BAYBEE_Bedside_Crib_fc&deal_type_id=9395&mediator_name=Samarth
Refund Form:
https://deal.jayshakthimarketing.com/refundform
Track Status:
https://deal.jayshakthimarketing.com/customer`;

test("creates one action per unique order, refund, and track URL", () => {
  const actions = getDealActions(`${firstCryDescription}
Order Form: https://deal.jayshakthimarketing.com/orderform?product_code=BAYBEE_Bedside_Crib_fc&deal_type_id=9395&mediator_name=Samarth`);

  assert.deepEqual(actions.map((action) => action.label), [
    "Open Product",
    "Open Order Form",
    "Open Refund Form",
    "Track Order",
  ]);
});

test("keeps genuinely different product links as separate actions", () => {
  const actions = getDealActions("[Meal Pod Black](https://example.com/black)\n[Meal Pod Rouge](https://example.com/rouge)");

  assert.deepEqual(actions.map((action) => action.label), ["Open Meal Pod Black", "Open Meal Pod Rouge"]);
});

test("sends the unchanged caption without separate product-link or reference lines", () => {
  const description = `Product link: https://www.amazon.in/dp/example
Deal Type: Review
Order Form: https://example.com/orderform
Refund Form: https://example.com/refundform
Please share the order reference after placing the order.`;
  const fullDescription = `${description}\nSend order reference on WhatsApp: https://wa.me/919876543210`;
  const actions = getDealActions(
    fullDescription,
    {
      productName: "Winter Jacket",
      brand: "North Star",
      platform: "Amazon",
      orderPrice: 169,
      lessPrice: 89,
    },
  );
  const whatsappAction = actions.find((action) => action.type === "whatsapp");
  const whatsappUrl = new URL(whatsappAction?.url ?? "");
  const draftMessage = whatsappUrl.searchParams.get("text");
  const generatedMessageDetails = draftMessage?.slice(fullDescription.length) ?? "";

  assert.equal(whatsappAction?.label, "Send Reference on WhatsApp (MANDATORY)");
  assert.equal(whatsappUrl.origin + whatsappUrl.pathname, "https://wa.me/917588424031");
  assert.ok(draftMessage?.startsWith(description));
  assert.doesNotMatch(draftMessage ?? "", /^Reference:/m);
  assert.doesNotMatch(generatedMessageDetails, /^Reference:/m);
  assert.doesNotMatch(generatedMessageDetails, /^Product(?:\/order)? link:/m);
  assert.match(draftMessage ?? "", /Mediator: Samarth/);
  assert.match(draftMessage ?? "", /https:\/\/chat\.whatsapp\.com\//);
  assert.ok(draftMessage?.includes(fullDescription));
});

test("omits missing actions and extracts structured deal information", () => {
  const actions = getDealActions("Deal Type: Review\nNo links here");
  const information = extractDealInformation("Deal Type: Review\nMediator Name: Samarth\n⚠️ Don't Change Link");

  assert.deepEqual(actions, []);
  assert.deepEqual(information, {
    dealType: "Review",
    platform: null,
    brand: null,
    mediator: "Samarth",
    instruction: "⚠️ Don't Change Link",
  });
});
