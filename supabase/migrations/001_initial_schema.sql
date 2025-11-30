-- ============================================
-- JOURNI - Initial Database Schema
-- ============================================
-- Version: 1.0
-- Created: 2024-11-29
-- Safe to run: This script is idempotent (can run multiple times)
-- ============================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: users (User Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles extending Supabase Auth';

-- ============================================
-- TABLE 2: trips (Trips/Sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id BIGSERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtitle TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  session_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.trips IS 'Trips/sessions created by users';
COMMENT ON COLUMN public.trips.session_code IS '6-character unique code for joining trips';

-- ============================================
-- TABLE 3: trip_participants (Trip Members)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_participants (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

COMMENT ON TABLE public.trip_participants IS 'Many-to-many relationship between users and trips';

-- ============================================
-- TABLE 4: expenses (Expenses)
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'PEN' CHECK (currency IN ('PEN', 'USD', 'EUR', 'CLP', 'ARS', 'BRL', 'COP')),
  category TEXT,
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.expenses IS 'Expenses registered in each trip';
COMMENT ON COLUMN public.expenses.currency IS 'ISO 4217 currency code';

-- ============================================
-- TABLE 5: expense_splits (Expense Division)
-- ============================================
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id BIGSERIAL PRIMARY KEY,
  expense_id BIGINT NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

COMMENT ON TABLE public.expense_splits IS 'How expenses are split among participants';

-- ============================================
-- TABLE 6: chat_messages (Chat Messages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_bot_message BOOLEAN DEFAULT FALSE,
  related_expense_id BIGINT REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.chat_messages IS 'Group chat messages including bot responses';

-- ============================================
-- TABLE 7: photos (Photo Album)
-- ============================================
CREATE TABLE IF NOT EXISTS public.photos (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.photos IS 'Photos uploaded to trip albums';

-- ============================================
-- TABLE 8: locations (Visited Places)
-- ============================================
CREATE TABLE IF NOT EXISTS public.locations (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category TEXT,
  visited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.locations IS 'Places visited during trips';

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_creator_id ON public.trips(creator_id);
CREATE INDEX IF NOT EXISTS idx_trips_session_code ON public.trips(session_code);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON public.trips(start_date, end_date);

-- Trip participants indexes
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON public.trip_participants(user_id);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_user_id ON public.expenses(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);

-- Expense splits indexes
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_is_settled ON public.expense_splits(is_settled);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_trip_id ON public.chat_messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_trip_id ON public.photos(trip_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by_user_id ON public.photos(uploaded_by_user_id);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_trip_id ON public.locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON public.locations(latitude, longitude);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Journi database schema created successfully!';
  RAISE NOTICE '📊 Tables created: 8';
  RAISE NOTICE '🔍 Indexes created: 14';
  RAISE NOTICE '⚡ Triggers created: 3';
  RAISE NOTICE '👉 Next step: Run 002_rls_policies.sql to enable Row Level Security';
END $$;
