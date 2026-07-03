-- ============================================================
-- REMOVE VERSAO ANTIGA DA FUNCAO (com 2 argumentos)
DROP FUNCTION IF EXISTS public.calculate_next_dose_for_treatment(uuid, timestamp with time zone);

-- ============================================================
-- MIGRAÇÃO: Criar registros NEXT para tratamentos existentes
-- FarmaPocket v2
--
-- Este script deve ser executado no SQL Editor do Supabase
-- após as colunas schedule_date e taken_at terem sido adicionadas
-- à tabela scheduling.
--
-- Para cada tratamento ativo (exceto resgate), calcula a PRÓXIMA
-- DOSE PROGRAMADA a partir do último horário executado (Taken/Skipped).
-- Se nunca foi executado, usa o start_date/first_dose_time original,
-- sem pular horários passados.
--
-- Isso garante que, se o usuário ainda não tomou/pulou a dose das 8h,
-- ela continue aparecendo no card como NEXT.
-- ============================================================

-- Função auxiliar: retorna o último schedule executado (Taken/Skipped) de um tratamento
CREATE OR REPLACE FUNCTION public.get_last_executed_schedule(p_treatment_id uuid)
RETURNS TABLE(schedule_date date, schedule_time text)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT s.schedule_date, s.schedule_time
    FROM public.treatments_in_schedule tis
    JOIN public.scheduling s ON s.id = tis.scheduling_id
    WHERE tis.treatment_id = p_treatment_id
      AND s.action != 'NEXT'
    ORDER BY s.schedule_date DESC, s.schedule_time DESC
    LIMIT 1;
END;
$$;

-- Função auxiliar: calcula próxima data/hora para um tratamento
CREATE OR REPLACE FUNCTION public.calculate_next_dose_for_treatment(
    p_treatment_id uuid
)
RETURNS TABLE(schedule_date date, schedule_time text)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_treatment public.treatments%ROWTYPE;
    v_start_date date;
    v_end_date date;
    v_first_dose_time time without time zone;
    v_freq_hours integer;
    v_schedule_type text;
    v_last_date date;
    v_last_time text;
    v_candidate timestamp with time zone;
    v_day_of_week integer;
    v_time_str text;
    v_best_date date;
    v_best_time text;
    v_found boolean := false;
    v_slot record;
BEGIN
    SELECT * INTO v_treatment FROM public.treatments WHERE id = p_treatment_id;
    IF NOT FOUND THEN RETURN; END IF;

    v_start_date := v_treatment.start_date;
    v_end_date := v_treatment.end_date;
    v_first_dose_time := v_treatment.first_dose_time;
    v_freq_hours := COALESCE(v_treatment.frequency_hours, 0);
    v_schedule_type := COALESCE(v_treatment.schedule_type, 'periodic');

    -- Tratamentos de resgate não geram NEXT automático
    IF v_schedule_type = 'rescue' THEN RETURN; END IF;

    -- Busca último horário executado
    SELECT ls.schedule_date, ls.schedule_time
    INTO v_last_date, v_last_time
    FROM public.get_last_executed_schedule(p_treatment_id) ls;

    -- Horário semanal
    IF v_schedule_type = 'weekly' THEN
        v_best_date := NULL;
        v_best_time := NULL;

        -- Se nunca foi executado, usa now() como referencia (pula passado)
        -- Se ja foi executado, busca o proximo dia valido apos o ultimo
        IF v_last_date IS NOT NULL THEN
            v_candidate := (v_last_date + 1)::timestamp;
        ELSE
            v_candidate := now();
        END IF;

        FOR i IN 0..28 LOOP
            v_candidate := v_candidate + (i || ' days')::interval;
            v_day_of_week := EXTRACT(DOW FROM v_candidate)::integer;

            IF v_start_date IS NOT NULL AND v_candidate::date < v_start_date THEN CONTINUE; END IF;
            IF v_end_date IS NOT NULL AND v_candidate::date > v_end_date THEN CONTINUE; END IF;

            FOR v_slot IN
                SELECT mt.time
                FROM public.medication_times_on_treatment mt
                WHERE mt.treatment_id = p_treatment_id
                  AND mt.day_of_week = v_day_of_week
                ORDER BY mt.time ASC
            LOOP
                v_best_date := v_candidate::date;
                v_best_time := TO_CHAR(v_slot.time, 'HH24:MI');
                v_found := true;
                EXIT;
            END LOOP;

            IF v_found THEN EXIT; END IF;
        END LOOP;

        IF v_found THEN
            schedule_date := v_best_date;
            schedule_time := v_best_time;
            RETURN NEXT;
        END IF;
        RETURN;
    END IF;

    -- Horário periódico (legacy)
    IF v_freq_hours <= 0 OR v_first_dose_time IS NULL OR v_start_date IS NULL THEN RETURN; END IF;

    IF v_last_date IS NOT NULL AND v_last_time IS NOT NULL THEN
        -- Próximo horário após o último executado (sem pular)
        v_candidate := timezone('UTC', (v_last_date || ' ' || v_last_time)::timestamp);
        v_candidate := v_candidate + (v_freq_hours || ' hours')::interval;
    ELSE
        -- Nunca executado: primeiro horario futuro a partir de now()
        v_candidate := timezone('UTC', (v_start_date || ' ' || v_first_dose_time)::timestamp);
        WHILE v_candidate <= now() LOOP
            v_candidate := v_candidate + (v_freq_hours || ' hours')::interval;
        END LOOP;
    END IF;

    IF v_end_date IS NOT NULL AND v_candidate::date > v_end_date THEN RETURN; END IF;

    schedule_date := v_candidate::date;
    schedule_time := TO_CHAR(v_candidate, 'HH24:MI');
    RETURN NEXT;
END;
$$;

-- Função principal: migra todos os tratamentos ativos existentes
CREATE OR REPLACE FUNCTION public.migrate_existing_treatments_to_next()
RETURNS TABLE(treatment_id uuid, scheduling_id uuid)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_treatment public.treatments%ROWTYPE;
    v_next_date date;
    v_next_time text;
    v_existing_id uuid;
    v_schedule_id uuid;
    v_dosage numeric;
    v_day_of_week integer;
BEGIN
    FOR v_treatment IN
        SELECT t.*
        FROM public.treatments t
        JOIN public.dependents d ON d.id = t.dependent_id
        WHERE t.is_active = true
          AND COALESCE(t.schedule_type, 'periodic') != 'rescue'
    LOOP
        SELECT nd.schedule_date, nd.schedule_time
        INTO v_next_date, v_next_time
        FROM public.calculate_next_dose_for_treatment(v_treatment.id) nd
        LIMIT 1;

        IF v_next_date IS NULL THEN CONTINUE; END IF;

        -- Verifica se já existe um NEXT para o mesmo horário/dependente
        SELECT s.id INTO v_existing_id
        FROM public.scheduling s
        WHERE s.dependent_id = v_treatment.dependent_id
          AND s.schedule_date = v_next_date
          AND s.schedule_time = v_next_time
          AND s.action = 'NEXT';

        IF v_existing_id IS NULL THEN
            INSERT INTO public.scheduling (dependent_id, schedule_date, schedule_time, action)
            VALUES (v_treatment.dependent_id, v_next_date, v_next_time, 'NEXT')
            RETURNING id INTO v_schedule_id;
        ELSE
            v_schedule_id := v_existing_id;
        END IF;

        -- Determina a dosagem correta para o horário
        IF COALESCE(v_treatment.schedule_type, 'periodic') = 'weekly' THEN
            v_day_of_week := EXTRACT(DOW FROM v_next_date::timestamp)::integer;
            SELECT mt.dosage INTO v_dosage
            FROM public.medication_times_on_treatment mt
            WHERE mt.treatment_id = v_treatment.id
              AND mt.day_of_week = v_day_of_week
              AND TO_CHAR(mt.time, 'HH24:MI') = v_next_time
            LIMIT 1;
        ELSE
            v_dosage := v_treatment.dosage;
        END IF;

        -- Evita duplicar vínculo
        IF NOT EXISTS (
            SELECT 1 FROM public.treatments_in_schedule tis
            WHERE tis.scheduling_id = v_schedule_id
              AND tis.treatment_id = v_treatment.id
        ) THEN
            INSERT INTO public.treatments_in_schedule (scheduling_id, treatment_id, medication_id, dosage)
            VALUES (v_schedule_id, v_treatment.id, v_treatment.medication_id, COALESCE(v_dosage, 0));
        END IF;

        treatment_id := v_treatment.id;
        scheduling_id := v_schedule_id;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Execute a migração
SELECT * FROM public.migrate_existing_treatments_to_next();
