-- ============================================================
-- MIGRATION: Add ON DELETE CASCADE to treatments_in_schedule FKs
-- ============================================================
-- Run this if deleteTreatment fails with foreign key violation
-- on treatments_in_schedule.

-- 1. Treatment_id FK with cascade delete
ALTER TABLE public.treatments_in_schedule
    DROP CONSTRAINT IF EXISTS treatments_in_schedule_treatment_id_fkey;

ALTER TABLE public.treatments_in_schedule
    ADD CONSTRAINT treatments_in_schedule_treatment_id_fkey
    FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE CASCADE;

-- 2. Scheduling_id FK with cascade delete (optional, keeps consistency)
ALTER TABLE public.treatments_in_schedule
    DROP CONSTRAINT IF EXISTS treatments_in_schedule_scheduling_id_fkey;

ALTER TABLE public.treatments_in_schedule
    ADD CONSTRAINT treatments_in_schedule_scheduling_id_fkey
    FOREIGN KEY (scheduling_id) REFERENCES public.scheduling(id) ON DELETE CASCADE;

-- 3. Medication_id FK without cascade (medication should not be deleted
-- if used in schedules; controlled by application logic)
ALTER TABLE public.treatments_in_schedule
    DROP CONSTRAINT IF EXISTS treatments_in_schedule_medication_id_fkey;

ALTER TABLE public.treatments_in_schedule
    ADD CONSTRAINT treatments_in_schedule_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES public.medications(id);
