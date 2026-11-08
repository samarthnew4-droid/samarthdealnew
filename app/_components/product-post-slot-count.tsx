"use client";

import { useEffect, useRef, useState } from "react";

import { getOrderFormPostStatus, type OrderFormSlotAvailability } from "../_lib/order-form-slots";

export default function ProductPostSlotCount({
  formUrl,
  className = "mt-2",
  currentStatus,
  onStatusDetected,
  onDetectionResult,
}: {
  formUrl: string | null;
  className?: string;
  currentStatus?: "draft" | "live" | "over" | "checking" | "unavailable";
  onStatusDetected?: (status: "live" | "over") => void;
  onDetectionResult?: (status: "live" | "over" | "checking" | "unavailable") => void;
}) {
  const [slotResult, setSlotResult] = useState<{
    formUrl: string;
    availability: OrderFormSlotAvailability | null;
    unavailable: boolean;
  } | null>(null);
  const onStatusDetectedRef = useRef(onStatusDetected);
  const onDetectionResultRef = useRef(onDetectionResult);
  const currentStatusRef = useRef(currentStatus);

  useEffect(() => {
    onStatusDetectedRef.current = onStatusDetected;
  }, [onStatusDetected]);

  useEffect(() => {
    onDetectionResultRef.current = onDetectionResult;
  }, [onDetectionResult]);

  useEffect(() => {
    currentStatusRef.current = currentStatus;
  }, [currentStatus]);

  useEffect(() => {
    if (!formUrl) return;

    const requestedFormUrl = formUrl;
    const controller = new AbortController();
    onDetectionResultRef.current?.("checking");

    function markUnavailable() {
      setSlotResult({ formUrl: requestedFormUrl, availability: null, unavailable: true });
      onDetectionResultRef.current?.("unavailable");
    }

    async function loadSlots() {
      try {
        const response = await fetch(
          `/api/product-post-slots?url=${encodeURIComponent(requestedFormUrl)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          markUnavailable();
          return;
        }

        const result = (await response.json()) as {
          slots: OrderFormSlotAvailability | null;
        };
        setSlotResult({
          formUrl: requestedFormUrl,
          availability: result.slots,
          unavailable: !result.slots,
        });
        if (!result.slots) {
          markUnavailable();
          return;
        }

        const detectedStatus = getOrderFormPostStatus(result.slots);
        onDetectionResultRef.current?.(detectedStatus ?? "unavailable");
        if (detectedStatus && detectedStatus !== currentStatusRef.current) {
          onStatusDetectedRef.current?.(detectedStatus);
        }
      } catch {
        if (!controller.signal.aborted) markUnavailable();
      }
    }

    void loadSlots();

    return () => controller.abort();
  }, [formUrl]);

  if (!formUrl) return null;

  const currentResult = slotResult?.formUrl === formUrl ? slotResult : null;
  const availability = currentResult?.availability ?? null;
  const unavailable = currentResult?.unavailable ?? false;

  return (
    <div aria-live="polite" className={`${className} flex flex-wrap gap-1.5`}>
      {availability && availability.slots.length > 0
        ? availability.slots.map((slot) => (
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide md:text-xs ${
                slot.availableSlots > 0
                  ? "bg-sky-100 text-sky-800"
                  : "bg-rose-50 text-rose-700"
              }`}
              key={slot.dealType}
            >
              {slot.dealType}: {slot.availableSlots} {slot.availableSlots === 1 ? "slot" : "slots"}
            </span>
          ))
        : (
            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 md:text-xs">
              {availability
                ? "No slots available"
                : unavailable
                  ? "Slots unavailable"
                  : "Checking slots…"}
            </span>
          )}
    </div>
  );
}
