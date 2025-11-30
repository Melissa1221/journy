-- ============================================
-- JOURNI - Photos Table Extensions for AI Integration
-- ============================================
-- Version: 1.1
-- Created: 2024-11-29
-- Purpose: Add milestone relationship and AI-generated metadata fields to photos table
-- Safe to run: This script is idempotent (can run multiple times)
-- ============================================

-- Add milestone relationship
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS milestone_id BIGINT REFERENCES public.milestones(id) ON DELETE SET NULL;

-- Add AI-generated metadata fields
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detected_people TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

COMMENT ON COLUMN public.photos.milestone_id IS 'Links photo to a trip milestone/moment';
COMMENT ON COLUMN public.photos.description IS 'AI-generated description of photo content';
COMMENT ON COLUMN public.photos.tags IS 'AI-detected tags (e.g., ["landscape", "group", "food"])';
COMMENT ON COLUMN public.photos.detected_people IS 'Names of people detected in photo';
COMMENT ON COLUMN public.photos.storage_path IS 'Path in Supabase Storage bucket (e.g., "trip_123/abc.jpg")';
COMMENT ON COLUMN public.photos.order_index IS 'Display order within milestone';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photos_milestone_id ON public.photos(milestone_id);
CREATE INDEX IF NOT EXISTS idx_photos_order_index ON public.photos(milestone_id, order_index) WHERE milestone_id IS NOT NULL;

-- Trigger to update milestone photo count on insert
CREATE OR REPLACE FUNCTION update_milestone_photo_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.milestone_id IS NOT NULL THEN
    UPDATE public.milestones
    SET photo_count = photo_count + 1
    WHERE id = NEW.milestone_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_insert_update_milestone_count
  AFTER INSERT ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_photo_count_on_insert();

-- Trigger to update milestone photo count on delete
CREATE OR REPLACE FUNCTION update_milestone_photo_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.milestone_id IS NOT NULL THEN
    UPDATE public.milestones
    SET photo_count = GREATEST(photo_count - 1, 0)
    WHERE id = OLD.milestone_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_delete_update_milestone_count
  AFTER DELETE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_photo_count_on_delete();

-- Trigger to handle milestone change
CREATE OR REPLACE FUNCTION update_milestone_photo_count_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement old milestone
  IF OLD.milestone_id IS NOT NULL AND OLD.milestone_id != NEW.milestone_id THEN
    UPDATE public.milestones
    SET photo_count = GREATEST(photo_count - 1, 0)
    WHERE id = OLD.milestone_id;
  END IF;

  -- Increment new milestone
  IF NEW.milestone_id IS NOT NULL AND OLD.milestone_id != NEW.milestone_id THEN
    UPDATE public.milestones
    SET photo_count = photo_count + 1
    WHERE id = NEW.milestone_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_update_milestone_count
  AFTER UPDATE OF milestone_id ON public.photos
  FOR EACH ROW
  WHEN (OLD.milestone_id IS DISTINCT FROM NEW.milestone_id)
  EXECUTE FUNCTION update_milestone_photo_count_on_update();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Photos table extended successfully!';
  RAISE NOTICE '📊 New columns: milestone_id, description, tags, detected_people, storage_path, order_index';
  RAISE NOTICE '🔍 Indexes created: 2';
  RAISE NOTICE '⚡ Triggers created: 3 (auto-update milestone photo counts)';
  RAISE NOTICE '👉 Photos table is now ready for AI integration!';
END $$;
