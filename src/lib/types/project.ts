// @ts-nocheck
export type ProjectStatus = "requested" | "verifying" | "quoted";
export type DepositStatus = "received";
export type ActivityType = "outreach" | "milestone" | "note" | "user_action";

export interface QuotesSummary {
  suppliersCount: number;
  priceRange: string;
  leadTime: string;
}

export interface ProjectActivity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string; // ISO string
  meta?: {
    supplierId?: string;
    supplierName?: string;
    channel?: "whatsapp" | "email" | "copy" | null;
    action?: "sample_plan" | "quote_request";
  };
}

export interface ProjectRequiredInfo {
  labelPhotoUrl?: string | null;
  upc?: string | null;
  materialsAndDimensions?: string | null;
}

export interface Project {
  id: string;
  reportId: string;
  productName: string;
  createdAt: string; // ISO string
  status: ProjectStatus;
  depositStatus: DepositStatus;
  quotesSummary: QuotesSummary;
  activities?: ProjectActivity[];
  lastActivityAt?: string; // ISO string
  requiredInfo?: ProjectRequiredInfo;
}

