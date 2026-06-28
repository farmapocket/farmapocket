-- ============================================================
-- CALCULATED VIEWS
-- ============================================================
-- This file is idempotent: views are dropped and recreated.

-- View: Medication Autonomy
DROP VIEW IF EXISTS v_medication_autonomy;
CREATE VIEW v_medication_autonomy AS
WITH weekly_usage AS (
    SELECT
        mt.treatment_id,
        COALESCE(SUM(mt.dosage), 0) / 7.0 AS daily_usage
    FROM medication_times_on_treatment mt
    GROUP BY mt.treatment_id
)
SELECT 
    t.id AS treatment_id,
    m.id AS medication_id,
    m.name AS medication_name,
    d.id AS dependent_id,
    d.name AS dependent_name,
    m.stock_quantity,
    m.is_controlled,
    m.is_continuous_use,
    t.dosage,
    t.frequency_hours,
    CASE
        WHEN t.schedule_type = 'weekly' THEN ROUND(COALESCE(wu.daily_usage, 0), 2)
        WHEN t.frequency_hours > 0 THEN ROUND((24.0 / t.frequency_hours) * t.dosage, 2)
        ELSE 0
    END AS daily_usage,
    CASE 
        WHEN m.stock_quantity > 0 AND t.schedule_type = 'weekly' AND COALESCE(wu.daily_usage, 0) > 0
        THEN ROUND(m.stock_quantity / wu.daily_usage, 0)
        WHEN m.stock_quantity > 0 AND t.frequency_hours > 0 
        THEN ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage), 0)
        ELSE 0 
    END AS days_remaining,
    CASE 
        WHEN m.stock_quantity > 0 AND t.schedule_type = 'weekly' AND COALESCE(wu.daily_usage, 0) > 0
        THEN ROUND(m.stock_quantity / wu.daily_usage / 7.0, 2)
        WHEN m.stock_quantity > 0 AND t.frequency_hours > 0 
        THEN ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage) / 7.0, 2)
        ELSE 0 
    END AS weeks_remaining,
    CASE 
        WHEN m.stock_last_updated IS NOT NULL AND m.stock_quantity > 0 AND t.schedule_type = 'weekly' AND COALESCE(wu.daily_usage, 0) > 0
        THEN m.stock_last_updated::DATE + ROUND(m.stock_quantity / wu.daily_usage, 0)::INTEGER
        WHEN m.stock_last_updated IS NOT NULL AND m.stock_quantity > 0 AND t.frequency_hours > 0
        THEN m.stock_last_updated::DATE + 
             ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage), 0)::INTEGER
        ELSE NULL
    END AS estimated_runout_date,
    CASE 
        WHEN m.stock_quantity > 0 AND t.schedule_type = 'weekly' AND COALESCE(wu.daily_usage, 0) > 0
             AND m.stock_last_updated IS NOT NULL
        THEN (m.stock_last_updated::DATE + ROUND(m.stock_quantity / wu.daily_usage, 0)::INTEGER) <= CURRENT_DATE + 7
        WHEN m.stock_quantity > 0 AND t.frequency_hours > 0 
             AND m.stock_last_updated IS NOT NULL
        THEN (m.stock_last_updated::DATE + 
              ROUND(m.stock_quantity / ((24.0 / t.frequency_hours) * t.dosage), 0)::INTEGER) <= CURRENT_DATE + 7
        ELSE FALSE
    END AS low_stock_alert
FROM treatments t
JOIN medications m ON t.medication_id = m.id
JOIN dependents d ON t.dependent_id = d.id
LEFT JOIN weekly_usage wu ON wu.treatment_id = t.id
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
    hp.specialty AS professional_specialty,
    p.medication_id,
    m.name AS medication_name,
    p.units,
    p.expiration_date,
    p.status,
    p.used_date,
    CASE 
        WHEN p.expiration_date IS NOT NULL AND p.expiration_date < CURRENT_DATE AND p.status != 'Used' THEN 'Expired'
        WHEN p.status = 'Used' THEN 'Used'
        ELSE 'Valid'
    END AS computed_status,
    CASE 
        WHEN p.expiration_date IS NOT NULL THEN GREATEST(p.expiration_date - CURRENT_DATE, 0)
        ELSE NULL
    END AS days_until_expiration,
    CASE 
        WHEN p.expiration_date IS NOT NULL AND p.expiration_date <= CURRENT_DATE + 14 AND p.status != 'Used' THEN TRUE
        ELSE FALSE
    END AS expiring_soon
FROM prescriptions p
LEFT JOIN dependents d ON p.dependent_id = d.id
LEFT JOIN healthcare_professionals hp ON p.prescribed_by = hp.id
LEFT JOIN medications m ON p.medication_id = m.id;



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
    IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE AND NEW.status != 'Used' THEN
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
    v_schedule_type TEXT;
    v_frequency INTEGER;
    v_first_dose TIME;
    v_start_date DATE;
    v_now TIMESTAMPTZ := NOW();
    v_next_dose TIMESTAMPTZ;
    v_current_date DATE;
    v_found BOOLEAN := FALSE;
    v_rec RECORD;
BEGIN
    SELECT schedule_type, frequency_hours, first_dose_time, start_date
    INTO v_schedule_type, v_frequency, v_first_dose, v_start_date
    FROM treatments
    WHERE id = p_treatment_id;

    IF v_schedule_type = 'weekly' THEN
        -- Find next weekday/time on or after today (limited search to avoid infinite loops)
        FOR i IN 0..13 LOOP
            v_current_date := CURRENT_DATE + i;
            FOR v_rec IN
                SELECT mt.time
                FROM medication_times_on_treatment mt
                WHERE mt.treatment_id = p_treatment_id
                  AND mt.day_of_week = EXTRACT(DOW FROM v_current_date)::INTEGER
                ORDER BY mt.time
            LOOP
                v_next_dose := v_current_date::TIMESTAMPTZ + v_rec.time::INTERVAL;
                IF v_next_dose > v_now THEN
                    RETURN v_next_dose;
                END IF;
            END LOOP;
        END LOOP;
        RETURN NULL;
    END IF;

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
