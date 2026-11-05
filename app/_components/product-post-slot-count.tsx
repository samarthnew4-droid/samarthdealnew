"use client";

import { useEffect, useRef, useState } from "react";

import { getOrderFormPostStatus, type OrderFormSlotAvailability } from "../_lib/order-form-slots";
import { loadOrderFormSlots } from "../_lib/order-form-slot-client";

export default function ProductPostSlotCount({
  formUrl,
  className = "mt-2",
  currentStatus,
  onStatusDetected,
}: {
  formUrl: string | null;
  className?: string;
  currentStatus?: "draft" | "live" | "over";
  onStatusDetected?: (status: "live" | "over") => void;
}) {
  const [result, setResult] = useState<{
    formUrl: string;
    availability: OrderFormSlotAvailability | null;
    checkFailed: boolean;
  } | null>(null);
  const onStatusDetectedRef = useRef(onStatusDetected);
  const currentStatusRef = useRef(currentStatus);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onStatusDetectedRef.current = onStatusDetected;
  }, [onStatusDetected]);

  useEffect(() => {
    currentStatusRef.current = currentStatus;
  }, [currentStatus]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (!formUrl) return;

    let active = true;
    const requestedFormUrl = formUrl;

    async function checkSlots() {
      try {
        const availability = await loadOrderFormSlots(requestedFormUrl);
        if (!active || requestIdRef.current !== requestId) return;

        setResult({
          formUrl: requestedFormUrl,
          availability,
          checkFailed: !availability,
        });
        const detectedStatus = getOrderFormPostStatus(availability);
        if (detectedStatus && detectedStatus !== currentStatusRef.current) {
          onStatusDetectedRef.current?.(detectedStatus);
        }
      } catch {
        if (active && requestIdRef.current === requestId) {
          setResult({
            formUrl: requestedFormUrl,
            availability: null,
            checkFailed: true,
          });
        }
      }
    }

    void checkSlots();

    return () => {
      active = false;
    };
  }, [formUrl]);

  if (!formUrl) return null;
  const currentResult = result?.formUrl === formUrl ? result : null;
  const availability = currentResult?.availability ?? null;

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
                : currentResult?.checkFailed
                  ? "Unable to check slots"
                  : "Checking slots…"}
            </span>
          )}
    </div>
  );
}
