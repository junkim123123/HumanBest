// @ts-nocheck
// ============================================================================
// Project Types
// ============================================================================

export type ProjectStatus = "requested" | "verifying" | "quoted" | "completed" | "closed";

export type Incoterms = "FOB" | "CIF" | "EXW" | "DDP";

export type ShippingMode = "AirExpress" | "AirFreight" | "OceanFreight" | "Express";

export type DeadlineDays = 7 | 14 | 30;

export interface ProjectRequest {
  targetMoq: number;
  incoterms: Incoterms;
  shippingMode: ShippingMode;
  deadlineDays: DeadlineDays;
  contactEmail: string;
  whatsapp?: string;
  notes?: string;
}

export type DepositStatus = "unpaid" | "paid" | "credited" | "paid_mock";

export interface ProjectRequiredInfo {
  labelPhotoUrl?: string | null;
  upc?: string | null;
  materialsAndDimensions?: string | null;
}

export type MilestoneKey = "evidence_sweep" | "factory_outreach" | "quote_confirmation";
export type MilestoneStatus = "pending" | "active" | "done";

export interface VerifyingMilestone {
  key: MilestoneKey;
  label: string;
  status: MilestoneStatus;
  updatedAt: string | null;
}

// Re-export ProjectActivity and ActivityType from the source of truth
export type { ProjectActivity, ActivityType } from "@/lib/types/project";

export interface Project {
  id: string;
  reportId: string;
  status: ProjectStatus;
  request: ProjectRequest;
  depositAmount: number;
  depositCurrency: "USD";
  depositStatus: DepositStatus;
  depositCreditedAt: string | null;
  requiredInfo?: ProjectRequiredInfo;
  verifyingMilestones?: VerifyingMilestone[];
  activities?: ProjectActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateInput {
  reportId: string;
  request: ProjectRequest;
}

export interface ProjectCreateResponse {
  ok: boolean;
  projectId: string;
  error?: string;
}

export interface ProjectUpdateInput {
  requiredInfo?: Partial<ProjectRequiredInfo>;
  status?: ProjectStatus;
  verifyingMilestones?: VerifyingMilestone[];
  activities?: ProjectActivity[];
}

export interface ProjectResponse {
  success: boolean;
  data?: Project;
  error?: string;
}

