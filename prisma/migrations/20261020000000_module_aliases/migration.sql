-- Retain legacy course identifiers while giving confirmed parent modules one review page.
ALTER TABLE "Module" ADD COLUMN "canonicalModuleId" TEXT;
ALTER TABLE "Module" ADD CONSTRAINT "Module_canonicalModuleId_fkey"
  FOREIGN KEY ("canonicalModuleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Module" ADD CONSTRAINT "Module_not_own_alias"
  CHECK ("canonicalModuleId" IS NULL OR "canonicalModuleId" <> id);
CREATE INDEX "Module_canonicalModuleId_idx" ON "Module"("canonicalModuleId");

-- A single canonical level avoids cycles and makes every entry point resolve identically.
CREATE FUNCTION enforce_module_alias() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."canonicalModuleId" IS NOT NULL THEN
    PERFORM 1 FROM "Module" WHERE id = NEW."canonicalModuleId" FOR UPDATE;
    IF EXISTS (SELECT 1 FROM "Module" WHERE id = NEW."canonicalModuleId" AND "canonicalModuleId" IS NOT NULL)
      OR EXISTS (SELECT 1 FROM "Module" WHERE "canonicalModuleId" = NEW.id)
      OR EXISTS (SELECT 1 FROM "Review" WHERE "moduleId" = NEW.id) THEN
      RAISE EXCEPTION 'Alias must point directly to a parent and have no separate reviews';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "Module_alias_guard" BEFORE INSERT OR UPDATE OF "canonicalModuleId" ON "Module"
  FOR EACH ROW EXECUTE FUNCTION enforce_module_alias();

-- Old application instances must not recreate split reviews during a rolling deployment.
CREATE FUNCTION resolve_review_module() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_id TEXT;
BEGIN
  SELECT "canonicalModuleId" INTO parent_id FROM "Module" WHERE id = NEW."moduleId" FOR SHARE;
  NEW."moduleId" := COALESCE(parent_id, NEW."moduleId");
  RETURN NEW;
END $$;
CREATE TRIGGER "Review_canonical_module" BEFORE INSERT OR UPDATE OF "moduleId" ON "Review"
  FOR EACH ROW EXECUTE FUNCTION resolve_review_module();
