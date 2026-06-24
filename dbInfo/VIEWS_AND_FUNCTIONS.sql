-- ============================================================
-- CALCULATED VIEWS
-- ============================================================
-- This file is idempotent: views are dropped and recreated.

-- View: Medication Autonomy
DROP VIEW IF EXISTS v_medication_autonomy;
CREATE VIEW v_medication_autonomy AS
SELECT 
    t.id AS treatment_id,
    m.id AS medication_id,
    m.name AS medication_name,
    d.id AS dependent_id,
    d.name AS dependent_name,
    m.stock_quantity,
    t.dosage,
    t.frequency_hours,
    ROUND((24.0 / t.frequency_hours) * t.dosage, 2) AS daily_usage,
    CASE 
        WHEN m.stock_quantity > 0 AND t.frequency_hours > 0 
        THEN ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage), 0)
        ELSE 0 
    END AS days_remaining,
    CASE 
        WHEN m.stock_last_updated IS NOT NULL AND m.stock_quantity > 0
        THEN m.stock_last_updated::DATE + 
             ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage), 0)::INTEGER
        ELSE NULL
    END AS estimated_runout_date,
    CASE 
        WHEN m.stock_quantity > 0 AND t.frequency_hours > 0 
             AND m.stock_last_updated IS NOT NULL
        THEN (m.stock_last_updated::DATE + 
              ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage), 0)::INTEGER) <= CURRENT_DATE + 7
        ELSE FALSE
    END AS low_stock_alert
FROM treatments t
JOIN medications m ON t.medication_id = m.id
JOIN dependents d ON t.dependent_id = d.id
WHERE t.end_date IS NULL AND t.is_active = TRUE;

-- View: Treatment Duration
DROP VIEW IF EXISTS v_treatment_duration;
CREATE VIEW v_treatment_duration AS
SELECT 
    t.id AS treatment_id,
    m.name AS medication_name,
    d.name AS dependent_name,
    t.start_date,
    t.end_date,
    COALESCE(t.end_date, CURRENT_DATE) AS end_reference_date,
    DATE_PART('year', AGE(COALESCE(t.end_date, CURRENT_DATE), t.start_date)) AS years,
    DATE_PART('month', AGE(COALESCE(t.end_date, CURRENT_DATE), t.start_date)) AS months,
    DATE_PART('day', AGE(COALESCE(t.end_date, CURRENT_DATE), t.start_date)) AS days,
    CONCAT(
        DATE_PART('year', AGE(COALESCE(t.end_date, CURRENT_DATE), t.start_date))::INT, 'y, ',
        DATE_PART('month', AGE(COALESCE(t.end_date, CURRENT_DATE), t.start_date))::INT, 'm, ',
        DATE_PART('day', AGE(COALESCE(t.end_date, CURRENT_DATE), t.start_date))::INT, 'd'
    ) AS formatted_duration
FROM treatments t
JOIN medications m ON t.medication_id = m.id
JOIN dependents d ON t.dependent_id = d.id;

-- View: Prescription Status
DROP VIEW IF EXISTS v_prescription_status;
CREATE VIEW v_prescription_status AS
SELECT 
    p.id,
    p.dependent_id,
    d.name AS dependent_name,
    p.prescribed_by,
    hp.name AS professional_name,
    p.medication_id,
    m.name AS medication_name,
    p.units,
    p.expiration_date,
    p.status,
    p.used_date,
    CASE 
        WHEN p.expiration_date < CURRENT_DATE AND p.status != 'Used' THEN 'Expired'
        WHEN p.status = 'Used' THEN 'Used'
        ELSE 'Valid'
    END AS computed_status,
    CASE 
        WHEN p.expiration_date < CURRENT_DATE + 30 AND p.status != 'Used' THEN TRUE
        ELSE FALSE
    END AS expiring_soon
FROM prescriptions p
LEFT JOIN dependents d ON p.dependent_id = d.id
LEFT JOIN healthcare_professionals hp ON p.prescribed_by = hp.id
LEFT JOIN medications m ON p.medication_id = m.id;

-- NOTE: The following tables are also defined here for convenience.
-- They are dropped and recreated. If you prefer to keep data, move them
-- to TABLES_SCHEMA.sql and use CREATE TABLE IF NOT EXISTS instead.
DROP TABLE IF EXISTS public.treatments_in_schedule;
DROP TABLE IF EXISTS public.scheduling;

CREATE TABLE public.scheduling (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dependent_id uuid,
  schedule_time text,
  action text CHECK (action = ANY (ARRAY['Taken'::text, 'Skipped'::text])),
  notes text,
  CONSTRAINT scheduling_pkey PRIMARY KEY (id),
  CONSTRAINT scheduling_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id)
);

CREATE TABLE public.treatments_in_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scheduling_id uuid,
  treatment_id uuid,
  CONSTRAINT treatments_in_schedule_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_in_schedule_scheduling_id_fkey FOREIGN KEY (scheduling_id) REFERENCES public.scheduling(id),
  CONSTRAINT treatments_in_schedule_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id)
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================
-- Functions use CREATE OR REPLACE FUNCTION (already idempotent).
-- Triggers are dropped before creation so the script can be rerun.

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

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dependents_updated_at ON dependents;
CREATE TRIGGER update_dependents_updated_at
    BEFORE UPDATE ON dependents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update prescription status when expired
CREATE OR REPLACE FUNCTION check_prescription_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiration_date < CURRENT_DATE AND NEW.status != 'Used' THEN
        NEW.status = 'Expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_prescription_expiration ON prescriptions;
CREATE TRIGGER trigger_check_prescription_expiration
    BEFORE INSERT OR UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION check_prescription_expiration();

-- Function to calculate next dose time
CREATE OR REPLACE FUNCTION get_next_dose_time(p_treatment_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_frequency INTEGER;
    v_first_dose TIME;
    v_start_date DATE;
    v_now TIMESTAMPTZ := NOW();
    v_next_dose TIMESTAMPTZ;
BEGIN
    SELECT frequency_hours, first_dose_time, start_date
    INTO v_frequency, v_first_dose, v_start_date
    FROM treatments
    WHERE id = p_treatment_id;

    IF v_first_dose IS NULL THEN
        RETURN NULL;
    END IF;

    v_next_dose := v_start_date::TIMESTAMPTZ + v_first_dose::INTERVAL;

    WHILE v_next_dose <= v_now LOOP
        v_next_dose := v_next_dose + (v_frequency || ' hours')::INTERVAL;
    END LOOP;

    RETURN v_next_dose;
END;
$$ LANGUAGE plpgsql;
