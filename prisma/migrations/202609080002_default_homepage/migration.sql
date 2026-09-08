DO $$
DECLARE
  property_row RECORD;
  page_id UUID;
  actor_id UUID;
  hero_id UUID;
  rooms_id UUID;
  amenities_id UUID;
  contact_id UUID;
  newsletter_id UUID;
  snapshot JSONB;
BEGIN
  FOR property_row IN
    SELECT p.*, (SELECT m."userId" FROM "Membership" m WHERE m."propertyId" = p.id ORDER BY m."userId" LIMIT 1) AS "actorId"
    FROM "Property" p
  LOOP
    actor_id := property_row."actorId";

    IF actor_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "Page" WHERE "propertyId" = property_row.id AND slug = 'home' AND locale = property_row.locale
    ) THEN
      page_id := (md5(random()::text || clock_timestamp()::text)::uuid);
      hero_id := (md5(random()::text || clock_timestamp()::text)::uuid);
      rooms_id := (md5(random()::text || clock_timestamp()::text)::uuid);
      amenities_id := (md5(random()::text || clock_timestamp()::text)::uuid);
      contact_id := (md5(random()::text || clock_timestamp()::text)::uuid);
      newsletter_id := (md5(random()::text || clock_timestamp()::text)::uuid);

      snapshot := jsonb_build_object(
        'title', 'Welcome to ' || property_row.name,
        'slug', 'home',
        'locale', property_row.locale,
        'seoTitle', property_row.name || ' | A considered stay',
        'description', 'Discover thoughtful rooms, warm hospitality, and an easier way to plan your stay at ' || property_row.name || '.',
        'noIndex', false,
        'sections', jsonb_build_array(
          jsonb_build_object('id', hero_id::text, 'type', 'hero', 'visible', true, 'startsAt', NULL, 'endsAt', NULL, 'content', jsonb_build_object('eyebrow', property_row.name, 'heading', 'A stay worth remembering.', 'body', 'Thoughtful rooms, generous details, and a warm welcome for every guest.', 'imageId', '', 'ctaLabel', 'Explore rooms', 'ctaUrl', '/rooms', 'videoUrl', '', 'items', jsonb_build_array()), 'style', jsonb_build_object('background', 'ink', 'align', 'center', 'spacing', 'spacious', 'width', 'full')),
          jsonb_build_object('id', rooms_id::text, 'type', 'rooms', 'visible', true, 'startsAt', NULL, 'endsAt', NULL, 'content', jsonb_build_object('eyebrow', 'STAY AWHILE', 'heading', 'Rooms made for slowing down.', 'body', 'Find a space that feels like your own, with the comfort and care to make every night count.', 'imageId', '', 'ctaLabel', 'View all rooms', 'ctaUrl', '/rooms', 'videoUrl', '', 'items', jsonb_build_array()), 'style', jsonb_build_object('background', 'mist', 'align', 'left', 'spacing', 'spacious', 'width', 'contained')),
          jsonb_build_object('id', amenities_id::text, 'type', 'amenities', 'visible', true, 'startsAt', NULL, 'endsAt', NULL, 'content', jsonb_build_object('eyebrow', 'THOUGHTFUL DETAILS', 'heading', 'Everything you need, nothing you do not.', 'body', 'From an easy arrival to a restful night, our spaces are prepared around the way you want to stay.', 'imageId', '', 'ctaLabel', '', 'ctaUrl', '', 'videoUrl', '', 'items', jsonb_build_array()), 'style', jsonb_build_object('background', 'white', 'align', 'center', 'spacing', 'normal', 'width', 'contained')),
          jsonb_build_object('id', contact_id::text, 'type', 'contact', 'visible', true, 'startsAt', NULL, 'endsAt', NULL, 'content', jsonb_build_object('eyebrow', 'PLAN YOUR STAY', 'heading', 'Let us help you make it yours.', 'body', 'Have a question or a special request? Our team is here to help.', 'imageId', '', 'ctaLabel', 'Get in touch', 'ctaUrl', '/contact', 'videoUrl', '', 'items', jsonb_build_array()), 'style', jsonb_build_object('background', 'mist', 'align', 'center', 'spacing', 'normal', 'width', 'contained')),
          jsonb_build_object('id', newsletter_id::text, 'type', 'newsletter', 'visible', true, 'startsAt', NULL, 'endsAt', NULL, 'content', jsonb_build_object('eyebrow', 'STAY IN THE KNOW', 'heading', 'A little more of the good stuff.', 'body', 'Join our list for thoughtful updates, seasonal notes, and occasional offers.', 'imageId', '', 'ctaLabel', '', 'ctaUrl', '', 'videoUrl', '', 'items', jsonb_build_array()), 'style', jsonb_build_object('background', 'white', 'align', 'center', 'spacing', 'normal', 'width', 'contained'))
        )
      );

      INSERT INTO "Page" (id, "propertyId", slug, locale, title, status, seo, version, "publishedVersion")
      VALUES (page_id, property_row.id, 'home', property_row.locale, 'Welcome to ' || property_row.name, 'PUBLISHED', jsonb_build_object('title', property_row.name || ' | A considered stay', 'description', snapshot->>'description', 'noIndex', false), 1, 1);

      INSERT INTO "PageSection" (id, "pageId", type, position, content, style)
      SELECT (section->>'id')::uuid, page_id, section->>'type', position - 1, section->'content', section->'style'
      FROM jsonb_array_elements(snapshot->'sections') WITH ORDINALITY AS sections(section, position);

      INSERT INTO "PageRevision" (id, "pageId", version, snapshot, "actorId")
      VALUES (md5(random()::text || clock_timestamp()::text)::uuid, page_id, 1, snapshot, actor_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Menu" WHERE "propertyId" = property_row.id AND name = 'header' AND locale = property_row.locale) THEN
      INSERT INTO "Menu" (id, "propertyId", name, locale)
      VALUES (md5(random()::text || clock_timestamp()::text)::uuid, property_row.id, 'header', property_row.locale);
      INSERT INTO "MenuItem" (id, "menuId", label, url, "linkType", position)
      SELECT md5(random()::text || clock_timestamp()::text)::uuid, id, label, url, 'internal', position
      FROM "Menu" CROSS JOIN (VALUES ('Home', '/', 0), ('Rooms', '/rooms', 1), ('Contact', '/contact', 2)) AS links(label, url, position)
      WHERE "propertyId" = property_row.id AND name = 'header' AND locale = property_row.locale;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Menu" WHERE "propertyId" = property_row.id AND name = 'footer' AND locale = property_row.locale) THEN
      INSERT INTO "Menu" (id, "propertyId", name, locale)
      VALUES (md5(random()::text || clock_timestamp()::text)::uuid, property_row.id, 'footer', property_row.locale);
      INSERT INTO "MenuItem" (id, "menuId", label, url, "linkType", position)
      SELECT md5(random()::text || clock_timestamp()::text)::uuid, id, label, url, 'internal', position
      FROM "Menu" CROSS JOIN (VALUES ('Home', '/', 0), ('Rooms', '/rooms', 1), ('Contact', '/contact', 2)) AS links(label, url, position)
      WHERE "propertyId" = property_row.id AND name = 'footer' AND locale = property_row.locale;
    END IF;
  END LOOP;
END $$;

