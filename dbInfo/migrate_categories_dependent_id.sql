-- ============================================================
-- MIGRATION: Add dependent_id to categories and subcategories
-- ============================================================
-- Run this after updating the application if the categories/subcategories
-- tables already exist in your Supabase project.

-- 1. Ensure dependent_id column exists in categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'categories'
          AND column_name = 'dependent_id'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN dependent_id uuid;
    END IF;
END $$;

-- 2. Ensure dependent_id column exists in subcategories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'subcategories'
          AND column_name = 'dependent_id'
    ) THEN
        ALTER TABLE public.subcategories ADD COLUMN dependent_id uuid;
    END IF;
END $$;

-- 3. Foreign key for categories.dependent_id
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_dependent_id_fkey;
ALTER TABLE public.categories
    ADD CONSTRAINT categories_dependent_id_fkey
    FOREIGN KEY (dependent_id) REFERENCES public.dependents(id) ON DELETE CASCADE;

-- 4. Foreign key for subcategories.dependent_id
ALTER TABLE public.subcategories DROP CONSTRAINT IF EXISTS subcategories_dependent_id_fkey;
ALTER TABLE public.subcategories
    ADD CONSTRAINT subcategories_dependent_id_fkey
    FOREIGN KEY (dependent_id) REFERENCES public.dependents(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- 6. Recreate RLS policies
DROP POLICY IF EXISTS categories_select_policy ON public.categories;
DROP POLICY IF EXISTS categories_insert_policy ON public.categories;
DROP POLICY IF EXISTS categories_update_policy ON public.categories;
DROP POLICY IF EXISTS categories_delete_policy ON public.categories;

CREATE POLICY categories_select_policy ON public.categories
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY categories_insert_policy ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY categories_update_policy ON public.categories
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY categories_delete_policy ON public.categories
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS subcategories_select_policy ON public.subcategories;
DROP POLICY IF EXISTS subcategories_insert_policy ON public.subcategories;
DROP POLICY IF EXISTS subcategories_update_policy ON public.subcategories;
DROP POLICY IF EXISTS subcategories_delete_policy ON public.subcategories;

CREATE POLICY subcategories_select_policy ON public.subcategories
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY subcategories_insert_policy ON public.subcategories
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY subcategories_update_policy ON public.subcategories
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY subcategories_delete_policy ON public.subcategories
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));
