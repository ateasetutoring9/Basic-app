-- Add created_by to lectures and worksheets so the capture_version()
-- trigger can resolve v_actor on INSERT (same pattern as topics).

ALTER TABLE public.lectures
  ADD COLUMN IF NOT EXISTS created_by uuid
  REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS created_by uuid
  REFERENCES public.profiles(id) ON DELETE SET NULL;
