// Product (Knowledge) Types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAnalysis {
  productId: string;
  geminiAnalysis: GeminiAnalysis | null;
  supplierMatches: SupplierMatch[];
  landedCost: LandedCost | null;
  createdAt: string;
}

export interface GeminiAnalysis {
  productName: string;
  description: string;
  category: string;
  attributes: Record<string, string>;
  keywords: string[];
}

export interface SupplierMatch {
  supplierId: string;
  supplierName: string;
  productName: string;
  unitPrice: number;
  moq: number; // Minimum Order Quantity
  leadTime: number; // days
  matchScore: number; // 0-100
  importKeyId: string | null;
}

export interface LandedCost {
  unitPrice: number;
  dutyRate: number; // decimal (e.g., 0.15 for 15%)
  shippingCost: number;
  fee: number;
  totalLandedCost: number;
  formula: string; // Unit * (1+Duty) + Shipping + Fee
}

// Order (Transaction) Types
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "draft" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

