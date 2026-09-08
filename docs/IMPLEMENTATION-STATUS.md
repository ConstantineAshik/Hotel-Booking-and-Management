# Implementation status

Updated 2026-09-08. This is a working implementation, not a production-readiness certification. `REQUIREMENTS.md` remains the full target; `ARCHITECTURE.md` describes the intended architecture and includes work that is not yet implemented.

## Implemented

- First-run setup, password authentication, hashed sessions, permission checks, origin checks, persistent request limits, and audit records.
- Staff account creation and editing, hotel-scoped custom roles, permission-limited delegation, conflict checks, session revocation on access changes, last-Super-Admin protection, deletion of unused roles, and a searchable activity log.
- Room types, physical units, amenities, optimized raster uploads, rates, seasonal adjustments, maintenance blocks, and whole-stay availability.
- Transactional reservations, concurrent inventory protection, idempotency, private confirmation access, manual bookings, rescheduling, and status changes. Checkout supports selectable services, promo codes, and configured taxes/fees; prices and promotion limits are revalidated while inventory and promo usage are locked. Rescheduling retains accepted services and redeemed promotions, reprices them for the new stay, and updates their ledger rows and booking snapshot atomically.
- Verified offline payment records, bounded refunds, cancellation calculations, immutable invoices and credit notes. Online payment adapters are not implemented.
- CMS pages and section editor, draft/published snapshots, preview, scheduled page worker, menus, appearance and site settings.
- Website-setting configuration export and draft-only import with schema validation, permission checks, media ownership validation, immutable revision creation, and browsable settings history. Page revisions can also be reviewed and restored into the editor.
- Content collections: offers, packages, testimonials, FAQs, gallery, nearby places, journal posts, and events; draft/publish/archive, public collection pages, visibility windows, and edit-conflict protection.
- Editable inquiry forms, contact and newsletter forms at setup, submission inbox, resolution, reopening, confirmed deletion.
- Booking confirmation and payment receipt templates; validated placeholders, delivery queue, retry controls, and disabled-template status. Resend transport requires a verified sender and a separately running worker. Live delivery has not been tested.
- Published SEO metadata, favicon and social image settings, robots rules, published-only sitemap, global indexing controls, and locale/direction on the document.
- Guest search and profiles, staff notes, preferences, VIP flags, confirmed booking blocks, reservation history, stale-edit protection, duplicate detection by email/phone, and audited transactional merges with reservation reassignment and retired-profile PII scrubbing.
- Date-filtered reports and authenticated CSV and Excel exports for successful payments, refunds, net collections, reservation creation, room revenue, occupied and available room-nights, occupancy, ADR, RevPAR, average booking value, cancellation rate, booking-source/status mix, promo usage, tax totals, guest performance, and room-type performance. A print-optimized report supports browser printing and PDF saving. Reports use the property timezone and keep cash collection separate from earned room revenue.
- Permission-aware operating dashboard with local-date arrivals and departures, room occupancy, net collections, active-booking balances, recent reservations, and recent successful payments.

## Verification

- Production packaging added: Dockerfile, Compose services, operator README, and guarded backup/restore scripts. Docker image build, container migrations, worker execution, standalone health/setup smoke tests, and seven database integrity checks passed. Database/media restore rehearsal remains pending.
- Starter homepage includes editable room search, room listings, stay-planning cards, FAQs, contact, and newsletter sections. Missing legacy homepages can be installed from Website administration. An upgrade script preserves customized pages and retains the previous revision when upgrading an untouched starter.
- Empty gallery sections no longer automatically expose unrelated media-library images.

- Unit tests cover dates, money, pricing, cancellation, credentials, authorization, forms, content visibility, request-size handling, notification placeholders, report dates, and CSV formula protection.
- The HTTP harness uses a temporary isolated database, migrates it, starts the production build, and exercises the actual application. It removes its own database and media afterward.
- CMS acceptance covers draft privacy, publication, conflicts, archive removal, inquiry handling, notification editing/retry, metadata, sitemap and indexing controls. Booking acceptance also covers retaining hidden extras and expired redeemed promotions during rescheduling and rendering the resulting price breakdown.
- Visual browser verification remains unavailable in this environment. Responsive CSS exists, but browser screenshots and keyboard/mobile interaction checks are still required.

## Remaining work

- Finish the remaining specification details and audit every exposed setting against the public behavior, including full localization, richer content controls, and metadata details.
- Extend promotions with free-service rewards and complete the advanced offer/package constraints from the full specification. Existing checkout promotions support fixed or percentage discounts, date/usage/customer limits, minimum totals/nights, and room/rate scopes.
- Complete the security/performance review, accessibility/browser acceptance, backup/restore verification, and deployment documentation.
- Implement and independently verify any required online payment, object storage, channel manager, SMS, or WhatsApp integrations before exposing them as supported.
- Production deployment and live external email/payment tests have not been performed.

## Local checks

```text
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:local-db
npm run test:http
```

The HTTP tests require Docker, the local `booking-postgres` container, and a current production build. No default administrator credentials are installed. Keep `.env` and uploaded guest data private.
