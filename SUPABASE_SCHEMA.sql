-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.laboratories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT laboratories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.dependents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_owner_id uuid,
  name text NOT NULL,
  date_of_birth date,
  relationship text,
  notes text,
  is_active boolean DEFAULT true,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dependents_pkey PRIMARY KEY (id),
  CONSTRAINT dependents_account_owner_id_fkey FOREIGN KEY (account_owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dependent_id uuid,
  name text NOT NULL,
  active_ingredient text,
  leaflet_url text,
  is_controlled boolean DEFAULT false,
  is_continuous_use boolean DEFAULT false,
  laboratory_id uuid,
  category_id uuid,
  subcategory_id uuid,
  stock_quantity integer DEFAULT 0,
  stock_last_updated timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medications_pkey PRIMARY KEY (id),
  CONSTRAINT medications_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT medications_laboratory_id_fkey FOREIGN KEY (laboratory_id) REFERENCES public.laboratories(id),
  CONSTRAINT medications_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT medications_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id)
);
CREATE TABLE public.healthcare_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dependent_id uuid,
  name text NOT NULL,
  specialty text,
  phone text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT healthcare_professionals_pkey PRIMARY KEY (id),
  CONSTRAINT healthcare_professionals_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id)
);
CREATE TABLE public.treatments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dependent_id uuid,
  prescribed_by uuid,
  medication_id uuid,
  dosage numeric(10,2) NOT NULL,
  frequency_hours integer NOT NULL,
  first_dose_time time without time zone,
  treatment_goal text,
  start_date date NOT NULL,
  end_date date,
  administration_notes text,
  replaced_treatment_id uuid,
  replaced_by_treatment_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT treatments_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT treatments_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.healthcare_professionals(id),
  CONSTRAINT treatments_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id),
  CONSTRAINT treatments_replaced_treatment_id_fkey FOREIGN KEY (replaced_treatment_id) REFERENCES public.treatments(id),
  CONSTRAINT treatments_replaced_by_treatment_id_fkey FOREIGN KEY (replaced_by_treatment_id) REFERENCES public.treatments(id)
);
CREATE TABLE public.symptoms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dependent_id uuid,
  description text NOT NULL,
  severity integer CHECK (severity >= 1 AND severity <= 10),
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT symptoms_pkey PRIMARY KEY (id),
  CONSTRAINT symptoms_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dependent_id uuid,
  description text NOT NULL,
  event_date date NOT NULL,
  event_type text CHECK (event_type = ANY (ARRAY['Surgery'::text, 'Procedure'::text, 'Exam'::text, 'Consultation'::text, 'Other'::text])),
  procedure_goal text,
  prescribed_by uuid,
  location text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT events_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.healthcare_professionals(id)
);
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dependent_id uuid,
  prescribed_by uuid,
  medication_id uuid,
  units integer NOT NULL,
  expiration_date date NOT NULL,
  status text DEFAULT 'Valid'::text CHECK (status = ANY (ARRAY['Valid'::text, 'Expired'::text, 'Used'::text])),
  used_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT prescriptions_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.healthcare_professionals(id),
  CONSTRAINT prescriptions_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id)
);
CREATE TABLE public.treatment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  treatment_id uuid,
  scheduled_time time without time zone NOT NULL,
  taken boolean DEFAULT false,
  taken_at timestamp with time zone,
  skipped boolean DEFAULT false,
  notes text,
  schedule_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT treatment_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT treatment_schedules_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id)
);

-- ============================================================
-- CALCULATED VIEWS
-- ============================================================

-- View: Medication Autonomy
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

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - NEW LOGIC
-- ============================================================
-- Users can access data where they are the account_owner of the dependent

-- Enable RLS on all tables
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_schedules ENABLE ROW LEVEL SECURITY;

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

-- Treatment Schedules
CREATE POLICY "Users can only access schedules of their dependents"
ON treatment_schedules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM treatments t
        JOIN dependents d ON t.dependent_id = d.id
        WHERE t.id = treatment_schedules.treatment_id 
        AND d.account_owner_id = auth.uid()
    )
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
