-- Migration: Add WhatsApp phone linking to users
-- This allows users to link their WhatsApp number to their account

-- Add phone_number column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE;

-- Add timestamp for when WhatsApp was linked
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS whatsapp_linked_at TIMESTAMP WITH TIME ZONE;

-- Create table for pending WhatsApp verification codes
CREATE TABLE IF NOT EXISTS public.whatsapp_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for looking up codes
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_code ON public.whatsapp_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_phone ON public.whatsapp_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_user ON public.whatsapp_verification_codes(user_id);

-- RLS policies for whatsapp_verification_codes
ALTER TABLE public.whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification codes
CREATE POLICY "Users can view own verification codes"
ON public.whatsapp_verification_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create verification codes for themselves
CREATE POLICY "Users can create own verification codes"
ON public.whatsapp_verification_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to verification codes"
ON public.whatsapp_verification_codes
FOR ALL
USING (auth.role() = 'service_role');

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.whatsapp_verification_codes
    WHERE expires_at < NOW() AND verified_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for users to update their own phone number
CREATE POLICY "Users can update own phone number"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMENT ON COLUMN public.users.phone_number IS 'WhatsApp phone number in E.164 format (e.g., +51999888777)';
COMMENT ON COLUMN public.users.whatsapp_linked_at IS 'Timestamp when user verified their WhatsApp number';
