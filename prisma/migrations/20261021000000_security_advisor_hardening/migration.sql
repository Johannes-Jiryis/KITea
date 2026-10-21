BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Keep the same trigger behavior, with no caller-controlled schema resolution.
CREATE OR REPLACE FUNCTION public.enforce_module_alias() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."canonicalModuleId" IS NOT NULL THEN
    PERFORM 1 FROM public."Module" WHERE id = NEW."canonicalModuleId" FOR UPDATE;
    IF EXISTS (SELECT 1 FROM public."Module" WHERE id = NEW."canonicalModuleId" AND "canonicalModuleId" IS NOT NULL)
      OR EXISTS (SELECT 1 FROM public."Module" WHERE "canonicalModuleId" = NEW.id)
      OR EXISTS (SELECT 1 FROM public."Review" WHERE "moduleId" = NEW.id) THEN
      RAISE EXCEPTION 'Alias must point directly to a parent and have no separate reviews';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.resolve_review_module() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE parent_id TEXT;
BEGIN
  SELECT "canonicalModuleId" INTO parent_id FROM public."Module" WHERE id = NEW."moduleId" FOR SHARE;
  NEW."moduleId" := COALESCE(parent_id, NEW."moduleId");
  RETURN NEW;
END $$;

-- Restrict direct calls only. Leave the existing Supabase event trigger and its
-- SECURITY DEFINER body/owner/search_path intact so automatic RLS still works.
DO $$
DECLARE
  function_name text;
  role_name text;
  preserve_service_execute boolean;
BEGIN
  FOREACH function_name IN ARRAY ARRAY[
    'public.enforce_module_alias()', 'public.resolve_review_module()', 'public.rls_auto_enable()'
  ] LOOP
    IF pg_catalog.to_regprocedure(function_name) IS NULL THEN CONTINUE; END IF;
    IF function_name = 'public.rls_auto_enable()' AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc
      WHERE oid = pg_catalog.to_regprocedure(function_name)
        AND prorettype = 'pg_catalog.event_trigger'::pg_catalog.regtype AND prosecdef
    ) THEN
      RAISE EXCEPTION 'Unexpected rls_auto_enable definition; inspect before changing privileges';
    END IF;
    preserve_service_execute := false;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
      preserve_service_execute := pg_catalog.has_function_privilege('service_role', function_name, 'EXECUTE');
    END IF;
    EXECUTE pg_catalog.format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', function_name);
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = role_name) THEN
        EXECUTE pg_catalog.format('REVOKE EXECUTE ON FUNCTION %s FROM %I', function_name, role_name);
      END IF;
    END LOOP;
    IF preserve_service_execute THEN
      EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %s TO service_role', function_name);
    END IF;
  END LOOP;
END $$;

-- Relocate extension objects without dropping the extension or rebuilding indexes.
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
DECLARE extension_schema text;
BEGIN
  SELECT n.nspname INTO extension_schema FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm';
  IF extension_schema = 'public' THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  ELSIF extension_schema IS DISTINCT FROM 'extensions' THEN
    RAISE EXCEPTION 'Unexpected pg_trgm schema: %; inspect before relocating', extension_schema;
  END IF;
END $$;
COMMIT;
