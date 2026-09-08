ALTER TABLE "Role" ADD COLUMN "propertyId" UUID, ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
DROP INDEX "Role_name_key";
CREATE UNIQUE INDEX "Role_propertyId_name_key" ON "Role"("propertyId",name);
CREATE UNIQUE INDEX "Role_system_name_key" ON "Role"(name) WHERE "propertyId" IS NULL;
ALTER TABLE "Role" ADD CONSTRAINT "Role_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT;
ALTER TABLE "Role" ADD CONSTRAINT "Role_scope_check" CHECK ((system AND "propertyId" IS NULL) OR (NOT system AND "propertyId" IS NOT NULL));
CREATE FUNCTION check_membership_role_scope() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM "Role" WHERE id=NEW."roleId" AND (system OR "propertyId"=NEW."propertyId")) THEN
  RAISE EXCEPTION 'Role does not belong to this property' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER membership_role_scope BEFORE INSERT OR UPDATE ON "Membership" FOR EACH ROW EXECUTE FUNCTION check_membership_role_scope();
