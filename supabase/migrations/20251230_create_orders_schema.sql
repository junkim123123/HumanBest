-- Migration: Create Orders and related schema
-- Adds orders, order_milestones, order_documents, quotes, and verification_requests tables

DO $$ 
BEGIN
    -- ============================================================================
    -- Table: verification_requests
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_requests') THEN
        CREATE TABLE public.verification_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            report_id UUID NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_verification_requests_report_id ON public.verification_requests(report_id);
        CREATE INDEX idx_verification_requests_user_id ON public.verification_requests(user_id);
        COMMENT ON TABLE public.verification_requests IS 'Tracks verification requests for reports leading to orders';
    END IF;

    -- ============================================================================
    -- Table: quotes
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        CREATE TABLE public.quotes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            verification_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
            report_id UUID NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            supplier_id TEXT NOT NULL,
            supplier_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            unit_price DECIMAL(12,2) NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            moq INTEGER NOT NULL DEFAULT 1,
            lead_time_days INTEGER NOT NULL DEFAULT 30,
            incoterm TEXT NOT NULL DEFAULT 'FOB' CHECK (incoterm IN ('FOB', 'CIF', 'DDP')),
            origin_country TEXT,
            status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
            verified_at TIMESTAMPTZ,
            position INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_quotes_verification_id ON public.quotes(verification_id);
        CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
        CREATE INDEX idx_quotes_status ON public.quotes(status);
        COMMENT ON TABLE public.quotes IS 'Supplier quotes from verification process - entry point to order creation';
    END IF;

    -- ============================================================================
    -- Table: orders
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        CREATE TABLE public.orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_number TEXT NOT NULL UNIQUE,
            quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE RESTRICT,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            supplier_id TEXT NOT NULL,
            supplier_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price DECIMAL(12,2) NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            incoterm TEXT NOT NULL DEFAULT 'FOB' CHECK (incoterm IN ('FOB', 'CIF', 'DDP')),
            origin_country TEXT,
            destination_country TEXT NOT NULL,
            total_amount DECIMAL(14,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'pending_shipment', 'shipped', 'delivered', 'cancelled')),
            payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
            estimated_delivery_date DATE,
            execution_fee DECIMAL(10,2) DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_orders_user_id ON public.orders(user_id);
        CREATE INDEX idx_orders_quote_id ON public.orders(quote_id);
        CREATE INDEX idx_orders_status ON public.orders(status);
        CREATE INDEX idx_orders_supplier_id ON public.orders(supplier_id);
        COMMENT ON TABLE public.orders IS 'Purchase orders created from verified quotes';
        COMMENT ON COLUMN public.orders.payment_status IS 'Payment tracking: unpaid, partial, paid, refunded';
    END IF;

    -- ============================================================================
    -- Table: order_milestones
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_milestones') THEN
        CREATE TABLE public.order_milestones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
            key TEXT NOT NULL CHECK (key IN ('quote_accepted', 'pi_issued', 'payment_received', 'production_started', 'quality_check', 'ready_to_ship', 'shipped', 'delivered')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
            scheduled_date DATE,
            completed_at TIMESTAMPTZ,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_order_milestones_order_id ON public.order_milestones(order_id);
        CREATE INDEX idx_order_milestones_status ON public.order_milestones(status);
        COMMENT ON TABLE public.order_milestones IS 'Key milestones in order execution timeline';
        COMMENT ON COLUMN public.order_milestones.key IS 'Milestone type: quote_accepted, pi_issued, payment_received, production_started, quality_check, ready_to_ship, shipped, delivered';
    END IF;

    -- ============================================================================
    -- Table: order_documents
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_documents') THEN
        CREATE TABLE public.order_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('quote', 'pi', 'qc_report', 'invoice', 'packing_list', 'bol', 'other')),
            title TEXT NOT NULL,
            description TEXT,
            file_url TEXT,
            file_size INTEGER,
            mime_type TEXT,
            uploaded_by TEXT,
            uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_order_documents_order_id ON public.order_documents(order_id);
        CREATE INDEX idx_order_documents_type ON public.order_documents(type);
        COMMENT ON TABLE public.order_documents IS 'Documents related to order execution (quote, PI, invoice, etc.)';
        COMMENT ON COLUMN public.order_documents.type IS 'Document type: quote, pi (proforma invoice), qc_report, invoice, packing_list, bol (bill of lading), other';
    END IF;

    -- ============================================================================
    -- RLS Policies
    -- ============================================================================
    ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_milestones ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

    -- Verification Requests RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_verification_requests') THEN
        CREATE POLICY user_read_own_verification_requests ON public.verification_requests
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_create_verification_requests') THEN
        CREATE POLICY user_create_verification_requests ON public.verification_requests
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Quotes RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_quotes') THEN
        CREATE POLICY user_read_own_quotes ON public.quotes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_create_quotes') THEN
        CREATE POLICY user_create_quotes ON public.quotes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_update_quotes') THEN
        CREATE POLICY user_update_quotes ON public.quotes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Orders RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_orders') THEN
        CREATE POLICY user_read_own_orders ON public.orders
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_create_orders') THEN
        CREATE POLICY user_create_orders ON public.orders
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_update_orders') THEN
        CREATE POLICY user_update_orders ON public.orders
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Order Milestones RLS (cascade from orders)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_order_milestones') THEN
        CREATE POLICY user_read_own_order_milestones ON public.order_milestones
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
            );
    END IF;

    -- Order Documents RLS (cascade from orders)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_order_documents') THEN
        CREATE POLICY user_read_own_order_documents ON public.order_documents
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
            );
    END IF;

    -- Triggers for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON public.verification_requests;
    CREATE TRIGGER update_verification_requests_updated_at
        BEFORE UPDATE ON public.verification_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
    CREATE TRIGGER update_quotes_updated_at
        BEFORE UPDATE ON public.quotes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
    CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_order_milestones_updated_at ON public.order_milestones;
    CREATE TRIGGER update_order_milestones_updated_at
        BEFORE UPDATE ON public.order_milestones
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_order_documents_updated_at ON public.order_documents;
    CREATE TRIGGER update_order_documents_updated_at
        BEFORE UPDATE ON public.order_documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

END $$;
