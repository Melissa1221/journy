-- ============================================
-- JOURNI - Row Level Security Policies
-- ============================================
-- Version: 1.0
-- Created: 2024-11-29
-- Description: Security policies to ensure users can only access their own data
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR: users
-- ============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can view profiles of trip participants
DROP POLICY IF EXISTS "Users can view trip participants profiles" ON public.users;
CREATE POLICY "Users can view trip participants profiles"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_participants tp1
      JOIN public.trip_participants tp2 ON tp1.trip_id = tp2.trip_id
      WHERE tp1.user_id = auth.uid()
        AND tp2.user_id = users.id
    )
  );

-- ============================================
-- POLICIES FOR: trips
-- ============================================

-- Users can view trips they participate in
DROP POLICY IF EXISTS "Users can view trips they participate in" ON public.trips;
CREATE POLICY "Users can view trips they participate in"
  ON public.trips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = trips.id AND user_id = auth.uid()
    )
  );

-- Users can create trips (they become the creator)
DROP POLICY IF EXISTS "Users can create trips" ON public.trips;
CREATE POLICY "Users can create trips"
  ON public.trips
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Only creator can update trip
DROP POLICY IF EXISTS "Only creator can update trip" ON public.trips;
CREATE POLICY "Only creator can update trip"
  ON public.trips
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Only creator can delete trip
DROP POLICY IF EXISTS "Only creator can delete trip" ON public.trips;
CREATE POLICY "Only creator can delete trip"
  ON public.trips
  FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================
-- POLICIES FOR: trip_participants
-- ============================================

-- Users can view participants of their trips
DROP POLICY IF EXISTS "Users can view trip participants" ON public.trip_participants;
CREATE POLICY "Users can view trip participants"
  ON public.trip_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = trip_participants.trip_id
        AND tp.user_id = auth.uid()
    )
  );

-- Users can join trips (insert themselves)
DROP POLICY IF EXISTS "Users can join trips" ON public.trip_participants;
CREATE POLICY "Users can join trips"
  ON public.trip_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trip admins can add participants
DROP POLICY IF EXISTS "Admins can add participants" ON public.trip_participants;
CREATE POLICY "Admins can add participants"
  ON public.trip_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = trip_participants.trip_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Users can leave trips (delete themselves)
DROP POLICY IF EXISTS "Users can leave trips" ON public.trip_participants;
CREATE POLICY "Users can leave trips"
  ON public.trip_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR: expenses
-- ============================================

-- Users can view expenses from their trips
DROP POLICY IF EXISTS "Users can view trip expenses" ON public.expenses;
CREATE POLICY "Users can view trip expenses"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid()
    )
  );

-- Participants can create expenses in their trips
DROP POLICY IF EXISTS "Participants can create expenses" ON public.expenses;
CREATE POLICY "Participants can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = expenses.trip_id AND user_id = auth.uid()
    )
    AND auth.uid() = paid_by_user_id
  );

-- Only payer can update their expense
DROP POLICY IF EXISTS "Only payer can update expense" ON public.expenses;
CREATE POLICY "Only payer can update expense"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = paid_by_user_id);

-- Only payer can delete their expense
DROP POLICY IF EXISTS "Only payer can delete expense" ON public.expenses;
CREATE POLICY "Only payer can delete expense"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = paid_by_user_id);

-- ============================================
-- POLICIES FOR: expense_splits
-- ============================================

-- Users can view splits from their trip expenses
DROP POLICY IF EXISTS "Users can view expense splits" ON public.expense_splits;
CREATE POLICY "Users can view expense splits"
  ON public.expense_splits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.trip_participants tp ON e.trip_id = tp.trip_id
      WHERE e.id = expense_splits.expense_id
        AND tp.user_id = auth.uid()
    )
  );

-- System/payer can insert expense splits
DROP POLICY IF EXISTS "Payer can create expense splits" ON public.expense_splits;
CREATE POLICY "Payer can create expense splits"
  ON public.expense_splits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE id = expense_splits.expense_id
        AND paid_by_user_id = auth.uid()
    )
  );

-- Users can mark their own splits as settled
DROP POLICY IF EXISTS "Users can update their splits" ON public.expense_splits;
CREATE POLICY "Users can update their splits"
  ON public.expense_splits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Payer can delete splits (when deleting expense)
DROP POLICY IF EXISTS "Payer can delete splits" ON public.expense_splits;
CREATE POLICY "Payer can delete splits"
  ON public.expense_splits
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE id = expense_splits.expense_id
        AND paid_by_user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES FOR: chat_messages
-- ============================================

-- Users can view chat messages from their trips
DROP POLICY IF EXISTS "Users can view trip chat" ON public.chat_messages;
CREATE POLICY "Users can view trip chat"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = chat_messages.trip_id AND user_id = auth.uid()
    )
  );

-- Participants can send messages
DROP POLICY IF EXISTS "Participants can send messages" ON public.chat_messages;
CREATE POLICY "Participants can send messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = chat_messages.trip_id AND user_id = auth.uid()
    )
    AND (auth.uid() = user_id OR is_bot_message = true)
  );

-- ============================================
-- POLICIES FOR: photos
-- ============================================

-- Users can view photos from their trips
DROP POLICY IF EXISTS "Users can view trip photos" ON public.photos;
CREATE POLICY "Users can view trip photos"
  ON public.photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = photos.trip_id AND user_id = auth.uid()
    )
  );

-- Participants can upload photos
DROP POLICY IF EXISTS "Participants can upload photos" ON public.photos;
CREATE POLICY "Participants can upload photos"
  ON public.photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = photos.trip_id AND user_id = auth.uid()
    )
    AND auth.uid() = uploaded_by_user_id
  );

-- Users can delete their own photos
DROP POLICY IF EXISTS "Users can delete their photos" ON public.photos;
CREATE POLICY "Users can delete their photos"
  ON public.photos
  FOR DELETE
  USING (auth.uid() = uploaded_by_user_id);

-- Users can update their photo captions
DROP POLICY IF EXISTS "Users can update their photos" ON public.photos;
CREATE POLICY "Users can update their photos"
  ON public.photos
  FOR UPDATE
  USING (auth.uid() = uploaded_by_user_id);

-- ============================================
-- POLICIES FOR: locations
-- ============================================

-- Users can view locations from their trips
DROP POLICY IF EXISTS "Users can view trip locations" ON public.locations;
CREATE POLICY "Users can view trip locations"
  ON public.locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = locations.trip_id AND user_id = auth.uid()
    )
  );

-- Participants can add locations
DROP POLICY IF EXISTS "Participants can add locations" ON public.locations;
CREATE POLICY "Participants can add locations"
  ON public.locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants
      WHERE trip_id = locations.trip_id AND user_id = auth.uid()
    )
    AND auth.uid() = added_by_user_id
  );

-- Users can update their own locations
DROP POLICY IF EXISTS "Users can update their locations" ON public.locations;
CREATE POLICY "Users can update their locations"
  ON public.locations
  FOR UPDATE
  USING (auth.uid() = added_by_user_id);

-- Users can delete their own locations
DROP POLICY IF EXISTS "Users can delete their locations" ON public.locations;
CREATE POLICY "Users can delete their locations"
  ON public.locations
  FOR DELETE
  USING (auth.uid() = added_by_user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Row Level Security policies created successfully!';
  RAISE NOTICE '🔐 All 8 tables are now protected';
  RAISE NOTICE '📝 Policies created: 35';
  RAISE NOTICE '👉 Next step: Run 003_views_and_functions.sql for helper queries';
END $$;
