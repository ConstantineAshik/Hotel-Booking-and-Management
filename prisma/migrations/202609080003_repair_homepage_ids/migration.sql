CREATE OR REPLACE FUNCTION "temporary_uuid_v4"() RETURNS UUID
LANGUAGE SQL VOLATILE AS $fn$
  SELECT (
    substr(raw, 1, 8) || '-' || substr(raw, 9, 4) || '-4' || substr(raw, 14, 3) || '-' ||
    substr('89ab', floor(random() * 4)::int + 1, 1) || substr(raw, 18, 3) || '-' || substr(raw, 21, 12)
  )::uuid
  FROM (SELECT md5(random()::text || clock_timestamp()::text) AS raw) generated;
$fn$;

DO $$
DECLARE
  page_row RECORD;
  section_row RECORD;
  replacement_id UUID;
  section_index INTEGER;
BEGIN
  FOR page_row IN SELECT id FROM "Page" WHERE slug = 'home' LOOP
    section_index := 0;
    FOR section_row IN SELECT id FROM "PageSection" WHERE "pageId" = page_row.id ORDER BY position LOOP
      replacement_id := "temporary_uuid_v4"();
      UPDATE "PageSection" SET id = replacement_id WHERE id = section_row.id;
      UPDATE "PageRevision"
      SET snapshot = jsonb_set(snapshot, ARRAY['sections', section_index::text, 'id'], to_jsonb(replacement_id::text), false)
      WHERE "pageId" = page_row.id;
      section_index := section_index + 1;
    END LOOP;
  END LOOP;
END $$;

DROP FUNCTION "temporary_uuid_v4"();