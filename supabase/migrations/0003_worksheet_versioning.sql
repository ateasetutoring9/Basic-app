-- Migration: add worksheet_history_id to attempts
-- Purpose: record which exact worksheet version an attempt was answering,
--          so edits to a worksheet after submission don't silently change
--          what the attempt was scored against.

-- 1. New column on the live table (nullable — existing rows have no version ref)
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS worksheet_history_id bigint
  REFERENCES public.worksheets_history(id) ON DELETE SET NULL;

-- 2. Mirror column on the history table (no FK — history tables have no constraints)
ALTER TABLE public.attempts_history
  ADD COLUMN IF NOT EXISTS worksheet_history_id bigint;

-- 3. Rebuild the capture trigger to include the new column
CREATE OR REPLACE FUNCTION public.attempts_history_capture()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.attempts_history (
      attempts_id, sync_id, user_id, worksheet_id,
      score, total, answers,
      worksheet_history_id,
      created_at, updated_at, deleted_at,
      operation, changed_at
    ) VALUES (
      OLD.id, OLD.sync_id, OLD.user_id, OLD.worksheet_id,
      OLD.score, OLD.total, OLD.answers,
      OLD.worksheet_history_id,
      OLD.created_at, OLD.updated_at, OLD.deleted_at,
      'delete', now()
    );
    RETURN OLD;
  ELSE
    INSERT INTO public.attempts_history (
      attempts_id, sync_id, user_id, worksheet_id,
      score, total, answers,
      worksheet_history_id,
      created_at, updated_at, deleted_at,
      operation, changed_at
    ) VALUES (
      NEW.id, NEW.sync_id, NEW.user_id, NEW.worksheet_id,
      NEW.score, NEW.total, NEW.answers,
      NEW.worksheet_history_id,
      NEW.created_at, NEW.updated_at, NEW.deleted_at,
      lower(TG_OP), now()
    );
    RETURN NEW;
  END IF;
END;
$$;
