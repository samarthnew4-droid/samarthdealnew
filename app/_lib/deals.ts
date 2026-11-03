export type DealStatus = "LIVE" | "OVER";

export type DealVisual = "audio" | "mobile" | "kitchen" | "gaming" | "home" | "travel";

export interface Deal {
  id: string;
  slug: string;
  productName: string;
  brand: string;
  imageUrl: string | null;
  description: string | null;
  dealType: string;
  orderPrice: number;
  finalPrice: number;
  platform: string;
  status: DealStatus;
  postedAt: string | null;
  visual: DealVisual;
}
