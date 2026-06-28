-- ============================================================
-- FARMAPOCKET: Apply frequency scheduling feature
-- Run this script on your Supabase SQL Editor
-- ============================================================

-- 1. Add schedule_type to treatments (idempotent)
ALTER TABLE public.treatments
ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'periodic'::text;

-- 2. Create medication_times_on_treatment table (idempotent)
CREATE TABLE IF NOT EXISTS public.medication_times_on_treatment (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    treatment_id uuid NOT NULL,
    day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time time without time zone NOT NULL,
    dosage numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT medication_times_on_treatment_pkey PRIMARY KEY (id),
    CONSTRAINT medication_times_on_treatment_treatment_id_fkey
        FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE CASCADE
);

-- 3. Grant privileges to authenticated role (important after table creation)
GRANT ALL PRIVILEGES ON TABLE public.medication_times_on_treatment TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.treatments TO authenticated;

-- 4. Enable RLS on the new table
ALTER TABLE public.medication_times_on_treatment ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policy if any and recreate it
DROP POLICY IF EXISTS "Users can only access medication times of their dependents"
ON public.medication_times_on_treatment;

CREATE POLICY "Users can only access medication times of their dependents"
ON public.medication_times_on_treatment FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.treatments t
        JOIN public.dependents d ON d.id = t.dependent_id
        WHERE t.id = medication_times_on_treatment.treatment_id
        AND d.account_owner_id = auth.uid()
    )
);

-- 6. Recreate v_medication_autonomy to support weekly schedules
DROP VIEW IF EXISTS public.v_medication_autonomy;

CREATE VIEW public.v_medication_autonomy AS
WITH weekly_usage AS (
    SELECT
        mt.treatment_id,
        COALESCE(SUM(mt.dosage), 0) / 7.0 AS daily_usage
    FROM public.medication_times_on_treatment mt
    GROUP BY mt.treatment_id
)
SELECT 
    t.id AS treatment_id,
    m.id AS medication_id,
    m.name AS medication_name,
    d.id AS dependent_id,
    d.name AS dependent_name,
    m.stock_quantity,
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
FROM public.treatments t
JOIN public.medications m ON t.medication_id = m.id
JOIN public.dependents d ON t.dependent_id = d.id
LEFT JOIN weekly_usage wu ON wu.treatment_id = t.id
WHERE t.end_date IS NULL AND t.is_active = TRUE;

-- 7. Recreate get_next_dose_time to support weekly schedules
CREATE OR REPLACE FUNCTION public.get_next_dose_time(p_treatment_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_schedule_type TEXT;
    v_frequency INTEGER;
    v_first_dose TIME;
    v_start_date DATE;
    v_now TIMESTAMPTZ := NOW();
    v_next_dose TIMESTAMPTZ;
    v_current_date DATE;
    v_rec RECORD;
BEGIN
    SELECT schedule_type, frequency_hours, first_dose_time, start_date
    INTO v_schedule_type, v_frequency, v_first_dose, v_start_date
    FROM public.treatments
    WHERE id = p_treatment_id;

    IF v_schedule_type = 'weekly' THEN
        FOR i IN 0..13 LOOP
            v_current_date := CURRENT_DATE + i;
            FOR v_rec IN
                SELECT mt.time
                FROM public.medication_times_on_treatment mt
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
