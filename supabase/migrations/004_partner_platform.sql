-- Partner Platform Schema - Swiggy + IDFC Inspired
-- Database extensions for partner dashboard and onboarding

-- Partner User Accounts (extends auth.users with partner role)
CREATE TABLE IF NOT EXISTS public.partner_accounts (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  onboarding_step INTEGER DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 4),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner KYC Documents (IDFC-style verification)
CREATE TABLE IF NOT EXISTS public.partner_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id UUID REFERENCES public.partner_accounts(id) ON DELETE CASCADE,
  fssai_license TEXT,
  fssai_expiry DATE,
  gst_number TEXT,
  pan_number TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_account_name TEXT,
  shop_license TEXT,
  documents_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Orders (link to customer orders)
CREATE TABLE IF NOT EXISTS public.partner_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  items JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Earnings (payouts tracking)
CREATE TABLE IF NOT EXISTS public.partner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.partner_orders(id),
  amount INTEGER NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  commission_amount INTEGER,
  net_amount INTEGER,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid')),
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (partners access only their data)
ALTER TABLE public.partner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_accounts
CREATE POLICY "Partners view own account" 
ON public.partner_accounts FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Partners update own account" 
ON public.partner_accounts FOR UPDATE 
USING (auth.uid() = id);

-- RLS Policies for partner_kyc
CREATE POLICY "Partners view own KYC" 
ON public.partner_kyc FOR SELECT 
USING (
  partner_account_id IN (
    SELECT id FROM public.partner_accounts WHERE id = auth.uid()
  )
);

CREATE POLICY "Partners insert own KYC" 
ON public.partner_kyc FOR INSERT 
WITH CHECK (
  partner_account_id IN (
    SELECT id FROM public.partner_accounts WHERE id = auth.uid()
  )
);

CREATE POLICY "Partners update own KYC" 
ON public.partner_kyc FOR UPDATE 
USING (
  partner_account_id IN (
    SELECT id FROM public.partner_accounts WHERE id = auth.uid()
  )
);

-- RLS Policies for partner_orders
CREATE POLICY "Partners view own orders" 
ON public.partner_orders FOR SELECT 
USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_accounts WHERE id = auth.uid()
  )
);

CREATE POLICY "Partners update own orders" 
ON public.partner_orders FOR UPDATE 
USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_accounts WHERE id = auth.uid()
  )
);

-- RLS Policies for partner_earnings
CREATE POLICY "Partners view own earnings" 
ON public.partner_earnings FOR SELECT 
USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_accounts WHERE id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_accounts_partner_id ON public.partner_accounts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_status ON public.partner_accounts(status);
CREATE INDEX IF NOT EXISTS idx_partner_orders_partner_id ON public.partner_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_orders_status ON public.partner_orders(status);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner_id ON public.partner_earnings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_payout_status ON public.partner_earnings(payout_status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_accounts_updated_at
BEFORE UPDATE ON public.partner_accounts
FOR EACH ROW
EXECUTE FUNCTION update_partner_updated_at();

CREATE TRIGGER partner_orders_updated_at
BEFORE UPDATE ON public.partner_orders
FOR EACH ROW
EXECUTE FUNCTION update_partner_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.partner_accounts IS 'Partner user accounts extending auth.users with business details';
COMMENT ON TABLE public.partner_kyc IS 'Partner KYC documents for verification (IDFC-style progressive disclosure)';
COMMENT ON TABLE public.partner_orders IS 'Partner-specific view of orders for fulfillment tracking';
COMMENT ON TABLE public.partner_earnings IS 'Partner earnings and payout tracking (Swiggy-style)';

