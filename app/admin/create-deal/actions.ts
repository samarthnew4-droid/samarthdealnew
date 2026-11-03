"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "../../_lib/admin-auth";
import { createSupabaseServerClient } from "../../_lib/supabase-server";
import type { CreateDealState } from "./state";

const dealStatuses = ["draft", "live", "paused", "sold_out", "expired", "over"] as const;
type DealStatus = (typeof dealStatuses)[number];

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalTextValue(formData: FormData, name: string) {
  const value = textValue(formData, name);
  return value || null;
}

function validUrl(value: string | null) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function nonNegativeNumber(value: string) {
  const parsed = Number(value);
  return value !== "" && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function nonNegativeInteger(value: string) {
  const parsed = Number(value);
  return value !== "" && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function optionalDate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function validate(formData: FormData) {
  const productName = textValue(formData, "productName");
  const brand = textValue(formData, "brand");
  const productCode = textValue(formData, "productCode");
  const imageUrl = optionalTextValue(formData, "imageUrl");
  const dealType = textValue(formData, "dealType");
  const platform = textValue(formData, "platform");
  const orderPriceValue = textValue(formData, "orderPrice");
  const lessPriceValue = textValue(formData, "lessPrice");
  const statusValue = textValue(formData, "status");
  const totalSlotsValue = textValue(formData, "totalSlots");
  const availableSlotsValue = textValue(formData, "availableSlots");
  const startTimeValue = textValue(formData, "startTime");
  const endTimeValue = textValue(formData, "endTime");
  const fieldErrors: Record<string, string> = {};

  if (!productName) fieldErrors.productName = "Product name is required.";
  if (!brand) fieldErrors.brand = "Brand is required.";
  if (!productCode) fieldErrors.productCode = "Product code is required.";
  if (!dealType) fieldErrors.dealType = "Deal type is required.";
  if (!platform) fieldErrors.platform = "Platform is required.";

  const orderPrice = nonNegativeNumber(orderPriceValue);
  if (orderPrice === null) fieldErrors.orderPrice = "Enter a valid non-negative price.";

  const lessPrice = nonNegativeNumber(lessPriceValue);
  if (lessPrice === null) fieldErrors.lessPrice = "Enter a valid non-negative final price.";

  if (!dealStatuses.includes(statusValue as DealStatus)) fieldErrors.status = "Choose a valid status.";

  const totalSlots = nonNegativeInteger(totalSlotsValue);
  if (totalSlots === null) fieldErrors.totalSlots = "Total slots must be a non-negative integer.";

  const availableSlots = nonNegativeInteger(availableSlotsValue);
  if (availableSlots === null) fieldErrors.availableSlots = "Available slots must be a non-negative integer.";
  if (totalSlots !== null && availableSlots !== null && availableSlots > totalSlots) {
    fieldErrors.availableSlots = "Available slots cannot exceed total slots.";
  }

  const urlFields = [
    ["imageUrl", imageUrl],
    ["externalOrderUrl", optionalTextValue(formData, "externalOrderUrl")],
    ["orderFormUrl", optionalTextValue(formData, "orderFormUrl")],
    ["refundFormUrl", optionalTextValue(formData, "refundFormUrl")],
    ["trackingUrl", optionalTextValue(formData, "trackingUrl")],
  ] as const;

  urlFields.forEach(([name, value]) => {
    if (!validUrl(value)) fieldErrors[name] = "Enter a valid http:// or https:// URL.";
  });

  const startTime = optionalDate(startTimeValue);
  if (startTimeValue && !startTime) fieldErrors.startTime = "Enter a valid start time.";

  const endTime = optionalDate(endTimeValue);
  if (endTimeValue && !endTime) fieldErrors.endTime = "Enter a valid end time.";
  if (startTime && endTime && new Date(endTime) < new Date(startTime)) {
    fieldErrors.endTime = "End time cannot be before start time.";
  }

  return {
    fieldErrors,
    values: {
      productName,
      brand,
      productCode,
      imageUrl,
      dealType,
      platform,
      orderPrice,
      lessPrice,
      status: statusValue as DealStatus,
      totalSlots,
      availableSlots,
      externalOrderUrl: optionalTextValue(formData, "externalOrderUrl"),
      mediatorName: optionalTextValue(formData, "mediatorName"),
      orderFormUrl: optionalTextValue(formData, "orderFormUrl"),
      refundFormUrl: optionalTextValue(formData, "refundFormUrl"),
      trackingUrl: optionalTextValue(formData, "trackingUrl"),
      rules: optionalTextValue(formData, "rules"),
      remarks: optionalTextValue(formData, "remarks"),
      startTime,
      endTime,
    },
  };
}

export async function createDealAction(_previousState: CreateDealState, formData: FormData): Promise<CreateDealState> {
  const { user, isAuthorized } = await getAdminSession();

  if (!user) {
    return { errorMessage: "Your session has expired. Please sign in again.", successMessage: null, fieldErrors: {} };
  }

  if (!isAuthorized) {
    return { errorMessage: "You are not authorized to create deals.", successMessage: null, fieldErrors: {} };
  }

  const details = textValue(formData, "details");
  const imageUrl = optionalTextValue(formData, "imageUrl");
  const status = textValue(formData, "status");
  const fieldErrors: Record<string, string> = {};
  if (!details) fieldErrors.details = "Product or deal details are required.";
  if (details.length > 10000) fieldErrors.details = "Product or deal details must be 10,000 characters or fewer.";
  if (!validUrl(imageUrl)) fieldErrors.imageUrl = "The uploaded image URL is invalid.";
  if (!dealStatuses.includes(status as DealStatus)) fieldErrors.status = "Choose a valid status.";
  if (Object.keys(fieldErrors).length > 0) {
    return { errorMessage: "Please correct the highlighted fields.", successMessage: null, fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error: descriptionColumnError } = await supabase.from("deals").select("description").limit(0);
  if (descriptionColumnError) {
    return {
      errorMessage: "The database does not expose deals.description yet. Review and apply the proposed migration before publishing descriptions.",
      successMessage: null,
      fieldErrors: {},
    };
  }

  return {
    errorMessage: "The current deals schema still requires structured product and campaign values. Image and description alone cannot safely create a public deal without inventing names, prices, platform, slot counts, or URLs.",
    successMessage: null,
    fieldErrors: {},
  };
}

export async function updateDealAction(formData: FormData) {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) return { errorMessage: "You are not authorized to update deals." };

  const dealId = textValue(formData, "dealId");
  if (!dealId) return { errorMessage: "A deal id is required." };

  const { fieldErrors, values } = validate(formData);
  if (Object.keys(fieldErrors).length > 0) return { errorMessage: "Please correct the highlighted fields.", fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { data: deal, error: dealLookupError } = await supabase.from("deals").select("product_id").eq("id", dealId).maybeSingle();
  if (dealLookupError || !deal) return { errorMessage: "That deal could not be found." };

  const description = textValue(formData, "description");
  const { error: descriptionColumnError } = await supabase.from("deals").select("description").limit(0);

  const { error: productError } = await supabase
    .from("products")
    .update({ name: values.productName, brand: values.brand, product_code: values.productCode, image_url: values.imageUrl })
    .eq("id", deal.product_id);
  if (productError) return { errorMessage: "We could not update the product." };

  const dealUpdate = {
    deal_type: values.dealType,
    platform: values.platform,
    order_price: values.orderPrice,
    less_price: values.lessPrice,
    external_order_url: values.externalOrderUrl,
    mediator_name: values.mediatorName,
    order_form_url: values.orderFormUrl,
    refund_form_url: values.refundFormUrl,
    tracking_url: values.trackingUrl,
    total_slots: values.totalSlots,
    available_slots: values.availableSlots,
    status: values.status,
    rules: values.rules,
    remarks: values.remarks,
    start_time: values.startTime,
    end_time: values.endTime,
    ...(descriptionColumnError ? {} : { description: description || null }),
  };
  const { error: updateError } = await supabase
    .from("deals")
    .update(dealUpdate)
    .eq("id", dealId);
  if (updateError) return { errorMessage: "We could not update the deal." };

  revalidatePath("/admin");
  revalidatePath("/admin/create-deal");
  return { errorMessage: null };
}

export async function updateDealStatusAction(dealId: string, status: string) {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) return { errorMessage: "You are not authorized to change deal status." };
  if (!dealId || !dealStatuses.includes(status as DealStatus)) return { errorMessage: "Choose a valid deal status." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("deals").update({ status }).eq("id", dealId);
  if (error) return { errorMessage: "We could not update the deal status." };

  revalidatePath("/admin");
  revalidatePath("/admin/create-deal");
  return { errorMessage: null };
}

export async function deleteDealAction(dealId: string) {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) return { errorMessage: "You are not authorized to delete deals." };
  if (!dealId) return { errorMessage: "A deal id is required." };

  const supabase = await createSupabaseServerClient();
  const { data: deal, error: lookupError } = await supabase.from("deals").select("product_id").eq("id", dealId).maybeSingle();
  if (lookupError || !deal) return { errorMessage: "That deal could not be found." };

  const { error: deleteError } = await supabase.from("deals").delete().eq("id", dealId);
  if (deleteError) return { errorMessage: "We could not delete the deal." };

  const { count, error: countError } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("product_id", deal.product_id);
  if (!countError && count === 0) {
    await supabase.from("products").delete().eq("id", deal.product_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/create-deal");
  return { errorMessage: null };
}