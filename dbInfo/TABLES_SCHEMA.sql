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
  dosage numeric NOT NULL,
  frequency_hours integer NOT NULL,
  first_dose_time time without time zone,
  treatment_goal text,
  start_date date NOT NULL,
  end_date date,
  administration_notes text,
  replaced_treatment_id uuid,
  replaced_by_treatment_id uuid,
  is_active boolean DEFAULT true,
  schedule_type text DEFAULT 'periodic'::text,
  is_rescue boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT treatments_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT treatments_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.healthcare_professionals(id),
  CONSTRAINT treatments_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id),
  CONSTRAINT treatments_replaced_treatment_id_fkey FOREIGN KEY (replaced_treatment_id) REFERENCES public.treatments(id),
  CONSTRAINT treatments_replaced_by_treatment_id_fkey FOREIGN KEY (replaced_by_treatment_id) REFERENCES public.treatments(id)
);
CREATE TABLE public.medication_times_on_treatment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  treatment_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time time without time zone NOT NULL,
  dosage numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medication_times_on_treatment_pkey PRIMARY KEY (id),
  CONSTRAINT medication_times_on_treatment_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE CASCADE
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
  expiration_date date,
  status text DEFAULT 'Valid'::text CHECK (status = ANY (ARRAY['Valid'::text, 'Expired'::text, 'Used'::text])),
  used_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT prescriptions_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.healthcare_professionals(id),
  CONSTRAINT prescriptions_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id)
);
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
  medication_id uuid,
  dosage numeric DEFAULT 0,
  CONSTRAINT treatments_in_schedule_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_in_schedule_scheduling_id_fkey FOREIGN KEY (scheduling_id) REFERENCES public.scheduling(id),
  CONSTRAINT treatments_in_schedule_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id),
  CONSTRAINT treatments_in_schedule_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id)
);

CREATE TABLE public.medical_procedures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dependent_id uuid NOT NULL,
  prescribed_by uuid,
  description text,
  date date NOT NULL,
  time time with time zone,
  CONSTRAINT medical_procedures_pkey PRIMARY KEY (id),
  CONSTRAINT medical_procedures_dependent_id_fkey FOREIGN KEY (dependent_id) REFERENCES public.dependents(id),
  CONSTRAINT medical_procedures_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.healthcare_professionals(id)
);