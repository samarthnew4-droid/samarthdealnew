import assert from "node:assert/strict";
import test from "node:test";

import {
  identifyProductOrderUrl,
  isAmazonPlatform,
  productOrderLinksInDescription,
} from "../app/_lib/product-links.ts";

test("recognizes Amazon platform name variants", () => {
  assert.equal(isAmazonPlatform("Amazon"), true);
  assert.equal(isAmazonPlatform("Amazon.in"), true);
  assert.equal(isAmazonPlatform("Amazon India"), true);
  assert.equal(isAmazonPlatform("Flipkart"), false);
  assert.equal(isAmazonPlatform(undefined), false);
});

test("normalizes tracking parameters and identifies the same Amazon product", () => {
  const first = identifyProductOrderUrl(
    "https://www.amazon.in/dp/B0F53TTJF5?utm_source=whatsapp&th=1",
  );
  const second = identifyProductOrderUrl(
    "https://amazon.in/dp/B0F53TTJF5/?psc=1&ref_=share",
  );

  assert.ok(first);
  assert.ok(second);
  assert.equal(first.identity, second.identity);
  assert.equal(first.platform, "Amazon");
});

test("does not match different product identifiers on similar product URLs", () => {
  const first = identifyProductOrderUrl("https://www.amazon.in/dp/B0F53TTJF5");
  const second = identifyProductOrderUrl("https://www.amazon.in/dp/B0F53TTJF6");

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.identity, second.identity);
});

test("matches Jayshakthi order links by product code regardless of tracking fields", () => {
  const first = identifyProductOrderUrl(
    "https://deal.jayshakthimarketing.com/orderform?product_code=BON_Dave_22.5W&deal_type_id=9487&mediator_name=Samarth",
  );
  const second = identifyProductOrderUrl(
    "https://deal.jayshakthimarketing.com/orderform/?mediator_name=Other&product_code=BON_Dave_22.5W&deal_type_id=9999",
  );

  assert.ok(first);
  assert.ok(second);
  assert.equal(first.identity, second.identity);
});

test("ignores social links, generic homepages, and unrelated URLs", () => {
  for (const url of [
    "https://chat.whatsapp.com/example",
    "https://www.instagram.com/samarthdeals/",
    "https://amazon.in/",
    "https://example.com/about",
    "https://example.com/?utm_source=whatsapp",
  ]) {
    assert.equal(identifyProductOrderUrl(url), null, url);
  }
});

test("recognizes structured product paths on external stores", () => {
  const link = identifyProductOrderUrl("https://shop.example.com/products/copper-bottle");

  assert.ok(link);
  assert.equal(link.platform, "");
  assert.equal(link.identity, "shop.example.com:path:copper-bottle");
});

test("recognizes a known product short-link without guessing its platform", () => {
  const link = identifyProductOrderUrl("https://bitli.in/QyeGq8Q");

  assert.ok(link);
  assert.equal(link.platform, "");
  assert.equal(link.identity, "bitli.in:short-link:qyegq8q");
});

test("recognizes Flipkart short links in product captions", () => {
  for (const url of ["https://fktr.in/3HIj2n0", "https://fktr.in/tIGjh0w"]) {
    const [link] = productOrderLinksInDescription(
      `Deal link: [${url}](${url})`,
    );

    assert.ok(link, url);
    assert.equal(link.platform, "Flipkart");
    assert.equal(link.url, url);
  }
});

test("recognizes Blinkit product links in Markdown captions", () => {
  for (const productId of ["807602", "792559"]) {
    const url = `https://blinkit.com/prn/x/prid/${productId}`;
    const [link] = productOrderLinksInDescription(
      `Product: [${url}](${url})`,
    );

    assert.ok(link, url);
    assert.equal(link.platform, "Blinkit");
    assert.equal(link.url, url);
    assert.equal(link.identity, `blinkit.com:path:${productId}`);
  }
});

test("recognizes Myntra short links in plain and Markdown captions", () => {
  for (const [caption, url] of [
    ["Deal: [https://myntr.it/oPJYxtG](https://myntr.it/oPJYxtG)", "https://myntr.it/oPJYxtG"],
    ["Deal: https://myntr.it/zgyhEty", "https://myntr.it/zgyhEty"],
  ]) {
    const [link] = productOrderLinksInDescription(caption);

    assert.ok(link, url);
    assert.equal(link.platform, "Myntra");
    assert.equal(link.url, url);
    assert.equal(link.identity, `myntr.it:short-link:${url.split("/").at(-1).toLowerCase()}`);
  }
});

test("extracts only actual product or order links from a caption", () => {
  const links = productOrderLinksInDescription(
    "Group: https://chat.whatsapp.com/example\nStore: https://example.com/\nProduct: https://www.amazon.in/dp/B0F53TTJF5",
  );

  assert.equal(links.length, 1);
  assert.equal(links[0].platform, "Amazon");
});
