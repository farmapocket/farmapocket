-- Migration: Add administration fields to medications
-- Idempotent: safe to rerun

ALTER TABLE public.medications
    ADD COLUMN IF NOT EXISTS expiring_date date,
    ADD COLUMN IF NOT EXISTS method_of_administration text,
    ADD COLUMN IF NOT EXISTS unit text;

-- Recreate dependent views that expose medication columns
DROP VIEW IF EXISTS public.v_medication_autonomy;
CREATE VIEW public.v_medication_autonomy AS
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
    m.unit,
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
