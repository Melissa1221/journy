-- ============================================
-- JOURNI - Anonymous Sessions Table
-- ============================================
-- Version: 1.0
-- Created: 2024-11-29
-- Description: Temporary sessions for anonymous users joining via session code
-- ============================================

-- Anonymous Sessions table
-- Stores temporary tokens for users who join without an account
CREATE TABLE IF NOT EXISTS public.anonymous_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate display names in same trip
    UNIQUE(trip_id, display_name)
);

COMMENT ON TABLE public.anonymous_sessions IS 'Temporary sessions for users who join trips via code without an account';
COMMENT ON COLUMN public.anonymous_sessions.id IS 'UUID token used for WebSocket authentication';
COMMENT ON COLUMN public.anonymous_sessions.display_name IS 'User-chosen display name for the trip';
COMMENT ON COLUMN public.anonymous_sessions.expires_at IS 'Token expires after 7 days of inactivity';

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_trip_id ON public.anonymous_sessions(trip_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_expires ON public.anonymous_sessions(expires_at);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend operations)
-- This table is managed by the backend, not directly by clients
CREATE POLICY "Service role full access to anonymous_sessions"
    ON public.anonymous_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Cleanup Function
-- ============================================

-- Function to clean up expired anonymous sessions
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.anonymous_sessions
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_anonymous_sessions IS 'Remove expired anonymous session tokens. Run periodically via cron.';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Anonymous sessions table created successfully!';
    RAISE NOTICE '📊 Table: anonymous_sessions';
    RAISE NOTICE '🔒 RLS enabled with service role access';
    RAISE NOTICE '⚡ Cleanup function: cleanup_expired_anonymous_sessions()';
END $$;
