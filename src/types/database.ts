// Database types matching supabase/schema_admin.sql

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  user_id: string
  product_name: string
  product_description: string | null
  analysis_result: any
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface Verification {
  id: string
  report_id: string
  user_id: string
  verification_type: 'certification' | 'inspection' | 'sample' | 'factory_audit' | 'lab_test'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  reports?: Report
  profiles?: Profile
}

export interface Order {
  id: string
  user_id: string
  report_id: string | null
  quote_id: string
  order_number: string
  supplier_id: string
  supplier_name: string
  product_name: string
  quantity: number
  unit_price: number
  currency: string
  incoterm: 'FOB' | 'CIF' | 'DDP'
  origin_country: string | null
  destination_country: string
  total_amount: number
  status: 'awaiting_invoice' | 'awaiting_payment' | 'in_progress' | 'pending_shipment' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  estimated_delivery_date: string | null
  execution_fee: number
  notes: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Quote {
  id: string
  verification_id: string
  report_id: string
  user_id: string
  supplier_id: string
  supplier_name: string
  product_name: string
  unit_price: number
  currency: string
  moq: number
  lead_time_days: number
  incoterm: 'FOB' | 'CIF' | 'DDP'
  origin_country: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  verified_at: string | null
  expiration_at: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled'
  payment_link: string | null
  created_at: string
  paid_at: string | null
}

export interface OrderTask {
  id: string
  order_id: string
  title: string
  description: string | null
  status: 'open' | 'done'
  created_at: string
  updated_at: string
}

export interface VerificationRequest {
  id: string
  report_id: string
  user_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface OrderMilestone {
  id: string
  order_id: string
  key: 'quote_accepted' | 'pi_issued' | 'payment_received' | 'production_started' | 'quality_check' | 'ready_to_ship' | 'shipped' | 'delivered'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  scheduled_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderDocument {
  id: string
  order_id: string
  type: 'quote' | 'pi' | 'qc_report' | 'invoice' | 'packing_list' | 'bol' | 'other'
  title: string
  description: string | null
  file_url: string | null
  uploaded_at: string
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  subject: string
  body: string
  message_type: 'inquiry' | 'support' | 'order_update' | 'verification_update' | 'general'
  read: boolean
  created_at: string
  profiles?: Profile
}

export interface Lead {
  id: string
  order_id?: string | null
  user_id?: string | null
  report_id?: string | null
  product_name?: string | null
  supplier_name?: string
  supplier_type?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  confidence_score?: number | null
  status: string
  source?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
  reports?: Report
}
