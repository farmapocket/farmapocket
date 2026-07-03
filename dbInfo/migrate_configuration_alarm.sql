-- ============================================================
-- MIGRATION: Add alarm column and fix configuration ownership
-- ============================================================
-- Run this after updating the application if the configuration
-- table already exists in your Supabase project.

-- 1. Ensure the alarm column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'configuration'
          AND column_name = 'alarm'
    ) THEN
        ALTER TABLE public.configuration ADD COLUMN alarm boolean DEFAULT false;
    END IF;
END $$;

-- 2. Ensure updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'configuration'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.configuration ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 3. Ensure selected_dependent_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'configuration'
          AND column_name = 'selected_dependent_id'
    ) THEN
        ALTER TABLE public.configuration ADD COLUMN selected_dependent_id uuid;
    END IF;
END $$;

-- 4. Fix foreign key to reference auth.users instead of dependents
ALTER TABLE public.configuration DROP CONSTRAINT IF EXISTS configuration_owner_id_fkey;
ALTER TABLE public.configuration
    ADD CONSTRAINT configuration_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Foreign key for selected_dependent_id
ALTER TABLE public.configuration DROP CONSTRAINT IF EXISTS configuration_selected_dependent_id_fkey;
ALTER TABLE public.configuration
    ADD CONSTRAINT configuration_selected_dependent_id_fkey
    FOREIGN KEY (selected_dependent_id) REFERENCES public.dependents(id) ON DELETE SET NULL;

-- 6. Ensure one row per user
ALTER TABLE public.configuration DROP CONSTRAINT IF EXISTS configuration_owner_id_unique;
ALTER TABLE public.configuration ADD CONSTRAINT configuration_owner_id_unique UNIQUE (owner_id);

-- 6. Enable RLS (safe to run even if already enabled)
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;

-- 7. Recreate RLS policies
DROP POLICY IF EXISTS configuration_select_policy ON public.configuration;
DROP POLICY IF EXISTS configuration_insert_policy ON public.configuration;
DROP POLICY IF EXISTS configuration_update_policy ON public.configuration;
DROP POLICY IF EXISTS configuration_delete_policy ON public.configuration;

CREATE POLICY configuration_select_policy ON public.configuration
    FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY configuration_insert_policy ON public.configuration
    FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY configuration_update_policy ON public.configuration
    FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY configuration_delete_policy ON public.configuration
    FOR DELETE TO authenticated USING (owner_id = auth.uid());
