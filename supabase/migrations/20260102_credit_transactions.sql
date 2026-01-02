-- Credit transactions history table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('monthly_grant', 'admin_grant', 'verification_used', 'refund', 'adjustment')),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user's transaction history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_credit_transactions') THEN
    CREATE POLICY user_read_own_credit_transactions ON public.credit_transactions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to add credits with transaction logging
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Upsert user_credits
  INSERT INTO public.user_credits (user_id, credits_balance)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id)
  DO UPDATE SET credits_balance = GREATEST(0, public.user_credits.credits_balance + p_amount);

  -- Get new balance
  SELECT credits_balance INTO v_new_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description, created_by)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, p_description, p_created_by);

  RETURN v_new_balance;
END;
$$;
