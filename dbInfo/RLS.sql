-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Users can access data where they are the account_owner of the dependent.
-- Reference tables (laboratories, categories, subcategories) are global
-- and do not have user-specific RLS policies in this project.

-- Enable RLS on all user-data tables
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments_in_schedule ENABLE ROW LEVEL SECURITY;

-- Helper function: get account_owner_id for a dependent
CREATE OR REPLACE FUNCTION get_dependent_owner(dep_id UUID)
RETURNS UUID AS $$
DECLARE
    owner_id UUID;
BEGIN
    SELECT account_owner_id INTO owner_id FROM dependents WHERE id = dep_id;
    RETURN owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dependents: owner sees only their dependents
CREATE POLICY "Users can only access their own dependents"
ON dependents FOR ALL
USING (account_owner_id = auth.uid());

-- Medications: user sees medications of dependents they own
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

-- Treatments in schedule: user can only link treatments they own
CREATE POLICY "Users can only access treatments_in_schedule of their dependents"
ON treatments_in_schedule FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = treatments_in_schedule.treatment_id
        AND d.account_owner_id = auth.uid()
    )
);
