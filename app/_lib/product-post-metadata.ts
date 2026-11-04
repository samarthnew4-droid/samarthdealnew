import {
  extractProductUrls,
  nullablePrice,
  parseProductPostMessage,
  platformFromUrl,
} from "./product-post-parser.ts";

const requestTimeoutMs = 1500;

type FetchedProductMetadata = {
  brand: string;
  rating: string;
};

function text(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/gi, "/");
}

/**
 * Extract an HTML attribute value.
 *
 * This intentionally supports either:
 *
 * property="og:title" content="..."
 *
 * or:
 *
 * content="..." property="og:title"
 */
function metaContent(
  html: string,
  attribute: "property" | "name",
  value: string,
) {
  const escapedAttribute = attribute.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const escapedValue = value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const patterns = [
    new RegExp(
      `<meta[^>]+${escapedAttribute}=["']${escapedValue}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${escapedAttribute}=["']${escapedValue}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtmlEntities(match[1]).trim();
    }
  }

  return "";
}

/**
 * Recursively search JSON-LD data for a Product.
 *
 * Handles:
 * - object
 * - array
 * - @graph
 * - @type: "Product"
 * - @type: ["Product", "..."]
 */
function findProductInJsonLd(
  value: unknown,
): Record<string, unknown> | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProductInJsonLd(item);

      if (found) return found;
    }

    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const object = value as Record<string, unknown>;

  const type = object["@type"];

  const isProduct =
    type === "Product" ||
    (Array.isArray(type) &&
      type.some(
        (item) =>
          typeof item === "string" &&
          item.toLowerCase() === "product",
      ));

  if (isProduct) {
    return object;
  }

  if (Array.isArray(object["@graph"])) {
    const found = findProductInJsonLd(
      object["@graph"],
    );

    if (found) return found;
  }

  return null;
}

function jsonLdProduct(
  html: string,
): FetchedProductMetadata {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  for (const script of scripts) {
    try {
      const raw = script[1];

      if (!raw) continue;

      const parsed: unknown = JSON.parse(raw);

      const product =
        findProductInJsonLd(parsed);

      if (!product) continue;

      const brandValue = product.brand;

      let brand = "";

      if (
        brandValue &&
        typeof brandValue === "object"
      ) {
        brand = text(
          (brandValue as Record<string, unknown>)
            .name,
        );
      } else {
        brand = text(brandValue);
      }

      const aggregateRating =
        product.aggregateRating;

      let rating = "";

      if (
        aggregateRating &&
        typeof aggregateRating === "object"
      ) {
        rating = text(
          (
            aggregateRating as Record<
              string,
              unknown
            >
          ).ratingValue,
        );
      }

      return {
        brand,
        rating,
      };
    } catch {
      // Continue with the next JSON-LD block.
    }
  }

  return {
    brand: "",
    rating: "",
  };
}

function listingUrlFromRedirect(url: string) {
  try {
    const parsed = new URL(url);

    const destination =
      parsed.searchParams.get("dl");

    if (!destination) return "";

    const destinationUrl = new URL(
      destination,
    );

    return /^https?:$/i.test(
      destinationUrl.protocol,
    )
      ? destinationUrl.toString()
      : "";
  } catch {
    return "";
  }
}

async function fetchProductPage(
  url: string,
): Promise<FetchedProductMetadata> {
  try {
    const target =
      listingUrlFromRedirect(url) || url;

    const response = await fetch(target, {
      headers: {
        "user-agent":
          "DealNest product metadata resolver/1.0",
        accept:
          "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(
        requestTimeoutMs,
      ),
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        brand: "",
        rating: "",
      };
    }

    const html = (
      await response.text()
    ).slice(0, 2_000_000);

    const structured =
      jsonLdProduct(html);

    return {
      brand:
        structured.brand ||
        metaContent(
          html,
          "property",
          "product:brand",
        ) ||
        metaContent(
          html,
          "name",
          "product:brand",
        ),

      rating:
        structured.rating ||
        metaContent(
          html,
          "property",
          "product:rating",
        ) ||
        metaContent(
          html,
          "name",
          "product:rating",
        ) ||
        metaContent(
          html,
          "property",
          "rating",
        ) ||
        metaContent(
          html,
          "name",
          "rating",
        ),
    };
  } catch {
    return {
      brand: "",
      rating: "",
    };
  }
}

function nullableRating(value: string) {
  const rating = Number(value);

  return Number.isFinite(rating) &&
    rating >= 0 &&
    rating <= 5
    ? rating
    : null;
}

/**
 * Resolve product metadata from the complete original
 * deal message.
 */
export async function resolveProductPostMetadata(
  message: string,
) {
  const parsed =
    parseProductPostMessage(message);

  const productUrls =
    extractProductUrls(message);

  /*
   * Prefer a known shopping-platform URL, otherwise use
   * the first extracted URL (including shorteners such
   * as bitli.in).
   */
  const productUrl =
    productUrls.find((url) =>
      platformFromUrl(url),
    ) ?? productUrls[0];

  const fetched =
    productUrl
      ? await fetchProductPage(productUrl)
      : {
          brand: "",
          rating: "",
        };

  return {
    productName: "",
    brand:
      fetched.brand ||
      parsed.brand ||
      null,

    platform:
      parsed.platform ||
      (productUrl
        ? platformFromUrl(productUrl)
        : "") ||
      null,

    orderPrice:
      nullablePrice(
        parsed.orderPrice,
      ),

    lessPrice:
      nullablePrice(
        parsed.lessPrice,
      ),

    rating:
      nullableRating(
        fetched.rating,
      ),
  };
}