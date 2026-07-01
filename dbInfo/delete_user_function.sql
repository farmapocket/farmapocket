-- ============================================================
-- FARMAPOCKET - Exclusão de Conta (LGPD)
-- Função para deletar permanentemente o usuário e todos os seus dados
-- ============================================================
-- 
-- Esta função deve ser executada no SQL Editor do Supabase.
-- Ela permite que um usuário autenticado exclua sua própria conta
-- e todos os dados associados (dependentes, medicamentos, tratamentos, etc.)
-- 
-- IMPORTANTE: A função usa SECURITY DEFINER para ter permissão de
-- deletar o registro na tabela auth.users.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
BEGIN
  -- Verificar se o usuário está autenticado
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 1. Deletar registros de treatments_in_schedule vinculados aos agendamentos do usuário
  DELETE FROM treatments_in_schedule
  WHERE scheduling_id IN (
    SELECT id FROM scheduling 
    WHERE dependent_id IN (
      SELECT id FROM dependents WHERE account_owner_id = user_id
    )
  );

  -- 2. Deletar agendamentos (scheduling)
  DELETE FROM scheduling
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 3. Remover auto-referências de treatments para evitar violação de FK
  UPDATE treatments
  SET replaced_treatment_id = NULL,
      replaced_by_treatment_id = NULL
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 4. Deletar horários dos tratamentos
  DELETE FROM medication_times_on_treatment
  WHERE treatment_id IN (
    SELECT id FROM treatments 
    WHERE dependent_id IN (
      SELECT id FROM dependents WHERE account_owner_id = user_id
    )
  );

  -- 5. Deletar tratamentos
  DELETE FROM treatments
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 6. Deletar receituários
  DELETE FROM prescriptions
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 7. Deletar eventos/procedimentos
  DELETE FROM events
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 8. Deletar sintomas
  DELETE FROM symptoms
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 9. Deletar procedimentos médicos
  DELETE FROM medical_procedures
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 10. Deletar profissionais de saúde
  DELETE FROM healthcare_professionals
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 11. Deletar medicamentos
  DELETE FROM medications
  WHERE dependent_id IN (
    SELECT id FROM dependents WHERE account_owner_id = user_id
  );

  -- 12. Deletar dependentes
  DELETE FROM dependents
  WHERE account_owner_id = user_id;

  -- 13. Deletar o próprio usuário do Auth
  DELETE FROM auth.users
  WHERE id = user_id;

END;
$$;
