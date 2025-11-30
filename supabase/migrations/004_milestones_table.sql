-- ============================================
-- JOURNI - Milestones Table for Photo Grouping
-- ============================================
-- Version: 1.1
-- Created: 2024-11-29
-- Purpose: Add milestones table for grouping trip photos by moments/locations
-- Safe to run: This script is idempotent (can run multiple times)
-- ============================================

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  photo_count INT DEFAULT 0,
  cover_photo_id BIGINT  -- Will be set after photos are added
);

COMMENT ON TABLE public.milestones IS 'Trip milestones/moments for grouping photos (e.g., "Sky Costanera visit", "Hotel arrival")';
COMMENT ON COLUMN public.milestones.name IS 'Name of the milestone (e.g., "Sky Costanera", "Lunch at La Mar")';
COMMENT ON COLUMN public.milestones.tags IS 'Tags for categorization (e.g., ["tourist", "food", "nature"])';
COMMENT ON COLUMN public.milestones.photo_count IS 'Cached count of photos in this milestone';
COMMENT ON COLUMN public.milestones.cover_photo_id IS 'ID of photo to use as milestone cover';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_milestones_trip_id ON public.milestones(trip_id);
CREATE INDEX IF NOT EXISTS idx_milestones_created_at ON public.milestones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_location ON public.milestones(location) WHERE location IS NOT NULL;

-- Function to increment photo count
CREATE OR REPLACE FUNCTION increment_milestone_photo_count(milestone_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.milestones
  SET photo_count = photo_count + 1
  WHERE id = milestone_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement photo count
CREATE OR REPLACE FUNCTION decrement_milestone_photo_count(milestone_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.milestones
  SET photo_count = GREATEST(photo_count - 1, 0)
  WHERE id = milestone_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Milestones table created successfully!';
  RAISE NOTICE '📊 Indexes created: 3';
  RAISE NOTICE '⚡ Functions created: 2 (increment/decrement photo count)';
  RAISE NOTICE '👉 Next: Run 005_photos_milestone_link.sql to add milestone relationship to photos';
END $$;
