import {
  isOrderFormSlotAvailability,
  type OrderFormSlotAvailability,
} from "./order-form-slots.ts";

const pendingRequests = new Map<
  string,
  Promise<OrderFormSlotAvailability | null>
>();

export function loadOrderFormSlots(
  formUrl: string,
): Promise<OrderFormSlotAvailability | null> {
  const pendingRequest = pendingRequests.get(formUrl);
  if (pendingRequest) return pendingRequest;

  const request = fetch(
    `/api/product-post-slots?url=${encodeURIComponent(formUrl)}`,
    { cache: "no-store" },
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Unable to check product slots.");
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("slots" in result)) {
        return null;
      }

      return isOrderFormSlotAvailability(result.slots) ? result.slots : null;
    })
    .finally(() => {
      if (pendingRequests.get(formUrl) === request) {
        pendingRequests.delete(formUrl);
      }
    });

  pendingRequests.set(formUrl, request);
  return request;
}
