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
            'scheduling',
            'treatments_in_schedule'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
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
ALTER TABLE scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments_in_schedule ENABLE ROW LEVEL SECURITY;


-- Dependents: owner sees only their dependents
CREATE POLICY "Users can only access their own dependents"
ON dependents FOR ALL
USING (account_owner_id = auth.uid());

-- Medications: user sees medications of dependents they own
-- Note: medications includes is_rescue_medication (boolean DEFAULT false).
-- Row-level access below covers all columns, including new ones.
CREATE POLICY "Users can only access medications of their dependents"
ON medications FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = medications.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Healthcare Professionals
CREATE POLICY "Users can only access professionals of their dependents"
ON healthcare_professionals FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = healthcare_professionals.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Treatments
CREATE POLICY "Users can only access treatments of their dependents"
ON treatments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = treatments.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Medication times on treatment
CREATE POLICY "Users can only access medication times of their dependents"
ON medication_times_on_treatment FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON d.id = t.dependent_id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    )
);

-- Symptoms
CREATE POLICY "Users can only access symptoms of their dependents"
ON symptoms FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = symptoms.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Events
CREATE POLICY "Users can only access events of their dependents"
ON events FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = events.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Prescriptions
CREATE POLICY "Users can only access prescriptions of their dependents"
ON prescriptions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = prescriptions.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Scheduling: owner sees only schedules of their dependents
CREATE POLICY "Users can only access scheduling of their dependents"
ON scheduling FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM dependents d 
        WHERE d.id = scheduling.dependent_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- Treatments in schedule: user can only link treatments or medications they own
CREATE POLICY "Users can only access treatments_in_schedule of their dependents"
ON treatments_in_schedule FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = treatments_in_schedule.treatment_id
        AND d.account_owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM medications m
        JOIN dependents d ON m.dependent_id = d.id
        WHERE m.id = treatments_in_schedule.medication_id
        AND d.account_owner_id = auth.uid()
    )
);
