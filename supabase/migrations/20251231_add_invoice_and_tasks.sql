-- Migration: Add Invoice and OrderTask tables for payment workflow
-- Also updates Order status enum and adds expiration_at to quotes

DO $$ 
BEGIN
    -- ============================================================================
    -- Update quotes table: Add expiration_at
    -- ============================================================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes' 
        AND column_name = 'expiration_at'
    ) THEN
        ALTER TABLE public.quotes ADD COLUMN expiration_at TIMESTAMPTZ;
        COMMENT ON COLUMN public.quotes.expiration_at IS 'Quote expiration date - quotes expire after 30 days by default';
    END IF;

    -- ============================================================================
    -- Update orders table: Modify status enum to include awaiting_invoice and awaiting_payment
    -- ============================================================================
    -- Drop existing constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_status_check' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
    END IF;

    -- Add new constraint with updated statuses
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('awaiting_invoice', 'awaiting_payment', 'in_progress', 'pending_shipment', 'shipped', 'delivered', 'cancelled'));

    -- ============================================================================
    -- Table: invoices
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        CREATE TABLE public.invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
            currency TEXT NOT NULL DEFAULT 'USD',
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
            payment_link TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            paid_at TIMESTAMPTZ
        );
        CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
        CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
        CREATE INDEX idx_invoices_status ON public.invoices(status);
        COMMENT ON TABLE public.invoices IS 'Invoices for order payments with Stripe payment links';
    END IF;

    -- ============================================================================
    -- Table: order_tasks
    -- ============================================================================
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_tasks') THEN
        CREATE TABLE public.order_tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_order_tasks_order_id ON public.order_tasks(order_id);
        CREATE INDEX idx_order_tasks_status ON public.order_tasks(status);
        COMMENT ON TABLE public.order_tasks IS 'Action items requiring user attention for orders';
    END IF;

    -- ============================================================================
    -- Triggers: Auto-update updated_at
    -- ============================================================================
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_order_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_order_tasks_updated_at
            BEFORE UPDATE ON public.order_tasks
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- ============================================================================
    -- RLS Policies: invoices
    -- ============================================================================
    ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
    CREATE POLICY "Users can view their own invoices"
        ON public.invoices FOR SELECT
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
    CREATE POLICY "Users can insert their own invoices"
        ON public.invoices FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- ============================================================================
    -- RLS Policies: order_tasks
    -- ============================================================================
    ALTER TABLE public.order_tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view tasks for their orders" ON public.order_tasks;
    CREATE POLICY "Users can view tasks for their orders"
        ON public.order_tasks FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE orders.id = order_tasks.order_id
                AND orders.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can update tasks for their orders" ON public.order_tasks;
    CREATE POLICY "Users can update tasks for their orders"
        ON public.order_tasks FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE orders.id = order_tasks.order_id
                AND orders.user_id = auth.uid()
            )
        );

END $$;
