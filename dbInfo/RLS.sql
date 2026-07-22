-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- This script can be run multiple times. It drops existing
-- policies on the application tables and recreates them.
-- Reference tables (laboratories, categories, subcategories)
-- are global and do not have user-specific RLS policies.

-- Helper: drop all existing policies on application tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'dependents',
            'medications',
            'healthcare_professionals',
            'treatments',
            'medication_times_on_treatment',
            'symptoms',
            'events',
            'prescriptions',
            'medications_in_prescription',
            'scheduling',
            'treatments_in_schedule',
            'configuration',
            'categories',
            'subcategories'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, 'public', pol.tablename);
    END LOOP;
END $$;


-- Enable RLS on all user-data tables
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_times_on_treatment ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications_in_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments_in_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- DEPENDENTS
-- ============================================================
CREATE POLICY dependents_select_policy ON dependents
    FOR SELECT TO authenticated USING (account_owner_id = auth.uid());

CREATE POLICY dependents_insert_policy ON dependents
    FOR INSERT TO authenticated WITH CHECK (account_owner_id = auth.uid());

CREATE POLICY dependents_update_policy ON dependents
    FOR UPDATE TO authenticated USING (account_owner_id = auth.uid()) WITH CHECK (account_owner_id = auth.uid());

CREATE POLICY dependents_delete_policy ON dependents
    FOR DELETE TO authenticated USING (account_owner_id = auth.uid());


-- ============================================================
-- MEDICATIONS
-- ============================================================
CREATE POLICY medications_select_policy ON medications
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = medications.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medications_insert_policy ON medications
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = medications.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medications_update_policy ON medications
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = medications.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = medications.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medications_delete_policy ON medications
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = medications.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- HEALTHCARE PROFESSIONALS
-- ============================================================
CREATE POLICY healthcare_professionals_select_policy ON healthcare_professionals
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = healthcare_professionals.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY healthcare_professionals_insert_policy ON healthcare_professionals
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = healthcare_professionals.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY healthcare_professionals_update_policy ON healthcare_professionals
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = healthcare_professionals.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = healthcare_professionals.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY healthcare_professionals_delete_policy ON healthcare_professionals
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = healthcare_professionals.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- TREATMENTS
-- ============================================================
CREATE POLICY treatments_select_policy ON treatments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = treatments.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY treatments_insert_policy ON treatments
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = treatments.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY treatments_update_policy ON treatments
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = treatments.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = treatments.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY treatments_delete_policy ON treatments
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = treatments.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- MEDICATION TIMES ON TREATMENT
-- ============================================================
CREATE POLICY medication_times_on_treatment_select_policy ON medication_times_on_treatment
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medication_times_on_treatment_insert_policy ON medication_times_on_treatment
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medication_times_on_treatment_update_policy ON medication_times_on_treatment
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medication_times_on_treatment_delete_policy ON medication_times_on_treatment
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- SYMPTOMS
-- ============================================================
CREATE POLICY symptoms_select_policy ON symptoms
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = symptoms.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY symptoms_insert_policy ON symptoms
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = symptoms.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY symptoms_update_policy ON symptoms
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = symptoms.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = symptoms.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY symptoms_delete_policy ON symptoms
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = symptoms.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- EVENTS (Procedures)
-- ============================================================
CREATE POLICY events_select_policy ON events
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = events.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY events_insert_policy ON events
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = events.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY events_update_policy ON events
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = events.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = events.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY events_delete_policy ON events
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = events.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- PRESCRIPTIONS
-- ============================================================
CREATE POLICY prescriptions_select_policy ON prescriptions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = prescriptions.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY prescriptions_insert_policy ON prescriptions
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = prescriptions.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY prescriptions_update_policy ON prescriptions
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = prescriptions.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = prescriptions.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY prescriptions_delete_policy ON prescriptions
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = prescriptions.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- MEDICATIONS IN PRESCRIPTION
-- ============================================================
-- A tabela medications_in_prescription nao possui dependent_id proprio.
-- O acesso e controlado pela receita vinculada (prescription_id).
CREATE POLICY medications_in_prescription_select_policy ON medications_in_prescription
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM prescriptions p
        JOIN dependents d ON p.dependent_id = d.id
        WHERE p.id = medications_in_prescription.prescription_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medications_in_prescription_insert_policy ON medications_in_prescription
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM prescriptions p
        JOIN dependents d ON p.dependent_id = d.id
        WHERE p.id = medications_in_prescription.prescription_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medications_in_prescription_update_policy ON medications_in_prescription
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM prescriptions p
        JOIN dependents d ON p.dependent_id = d.id
        WHERE p.id = medications_in_prescription.prescription_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM prescriptions p
        JOIN dependents d ON p.dependent_id = d.id
        WHERE p.id = medications_in_prescription.prescription_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY medications_in_prescription_delete_policy ON medications_in_prescription
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM prescriptions p
        JOIN dependents d ON p.dependent_id = d.id
        WHERE p.id = medications_in_prescription.prescription_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- SCHEDULING
-- ============================================================
CREATE POLICY scheduling_select_policy ON scheduling
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = scheduling.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY scheduling_insert_policy ON scheduling
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = scheduling.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY scheduling_update_policy ON scheduling
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = scheduling.dependent_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = scheduling.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY scheduling_delete_policy ON scheduling
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = scheduling.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- TREATMENTS IN SCHEDULE
-- ============================================================
-- A tabela treatments_in_schedule nao possui dependent_id proprio.
-- O acesso e controlado pelo schedule vinculado (scheduling_id).
CREATE POLICY treatments_in_schedule_select_policy ON treatments_in_schedule
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM scheduling s
        JOIN dependents d ON s.dependent_id = d.id
        WHERE s.id = treatments_in_schedule.scheduling_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY treatments_in_schedule_insert_policy ON treatments_in_schedule
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM scheduling s
        JOIN dependents d ON s.dependent_id = d.id
        WHERE s.id = treatments_in_schedule.scheduling_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY treatments_in_schedule_update_policy ON treatments_in_schedule
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM scheduling s
        JOIN dependents d ON s.dependent_id = d.id
        WHERE s.id = treatments_in_schedule.scheduling_id
        AND d.account_owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM scheduling s
        JOIN dependents d ON s.dependent_id = d.id
        WHERE s.id = treatments_in_schedule.scheduling_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY treatments_in_schedule_delete_policy ON treatments_in_schedule
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM scheduling s
        JOIN dependents d ON s.dependent_id = d.id
        WHERE s.id = treatments_in_schedule.scheduling_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- CONFIGURATION
-- ============================================================
CREATE POLICY configuration_select_policy ON configuration
    FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY configuration_insert_policy ON configuration
    FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY configuration_update_policy ON configuration
    FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY configuration_delete_policy ON configuration
    FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- ============================================================
-- CATEGORIES (per-dependent)
-- ============================================================
CREATE POLICY categories_select_policy ON categories
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY categories_insert_policy ON categories
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY categories_update_policy ON categories
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

CREATE POLICY categories_delete_policy ON categories
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM dependents d
        WHERE d.id = categories.dependent_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- SUBCATEGORIES (per-dependent via category)
-- ============================================================
CREATE POLICY subcategories_select_policy ON subcategories
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY subcategories_insert_policy ON subcategories
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));

CREATE POLICY subcategories_update_policy ON subcategories
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

CREATE POLICY subcategories_delete_policy ON subcategories
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM categories c
        JOIN dependents d ON c.dependent_id = d.id
        WHERE c.id = subcategories.category_id
        AND d.account_owner_id = auth.uid()
    ));


-- ============================================================
-- REFERENCE TABLES (global data - no user-specific restrictions)
-- ============================================================
-- Laboratories is a global reference table.
-- If RLS was enabled on it, disable it so all authenticated users
-- can read and manage the shared reference lists.
ALTER TABLE IF EXISTS laboratories DISABLE ROW LEVEL SECURITY;

