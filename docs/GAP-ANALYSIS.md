# Gap analysis (2026-09-07)

Where the project stands against `REQUIREMENTS.md` after a full code audit. Working document for the completion effort; superseded by `IMPLEMENTATION-STATUS.md` as work lands.

## Verified implemented

- First-run setup (one-time token), scrypt passwords, hashed sessions, expiry, password reset, persistent request limits, origin checks, RBAC with no privilege escalation, audit records.
- Property-scoped data model (`Property` + composite FKs) — multi-property ready without a rebuild.
- Shared `InventoryNight` ledger (unit, date) with a single owner per night; triggers reject wrong-type/out-of-stay allocations; advisory-locked, idempotent, request-hash-checked `reserve()` transaction; bounded refunds; credit notes; invoices.
- Room types, physical units (+ housekeeping status enum), amenities, media upload pipeline (raster re-encode, quarantine, private defaults).
- Rate plans + policy (cancellation) + seasonal/date overrides + maintenance blocks + whole-stay availability search; quote engine (`calculateQuote`) already computes nightlies, discounts, promo, extras, and included/excluded taxes in Decimal.
- CMS pages & sections (15 registered types), draft/published immutable `PageRevision`, preview, scheduled worker, menus, theme/header/footer/SEO/booking/features/announcement/maintenance/cookies/popup/invoice/tracking config namespaces with draft/published + revisions.
- Content collections (offers, packages, testimonials, faq, gallery, nearby, journal, events) with publish/archive + visibility windows.
- Custom forms + submissions inbox; email templates with validated placeholders + outbox worker; booking confirmation & payment receipt flows.
- SEO metadata, sitemap/robots, favicon/social image, indexing controls, locale/direction on `<html>`.
- Guest profiles (notes/preferences/VIP/blacklist), booking/check-in/check-out lifecycle, rescheduling, cancellation math.
- Reports + authenticated CSV export (payments, refunds, reservations, room-nights); dashboard basics; staff & custom-role admin (latest migration `202609070001_staff_roles`).
- Unit tests (dates, money, pricing, cancellation, credentials, authz, forms, content, notifications, reports, staff) and an HTTP harness against an isolated Postgres.

## Verified gaps (priority order)

1. **Money path wiring** — `TaxRule`, `Service`, `BookingService`, `PromoCode`, `PromoRedemption` tables exist and taxes already feed the availability quote, but:
   - no admin UI to manage taxes, services/add-ons, or promo codes;
   - `reserve()`/`manualBooking`/checkout accept only dates + one rate plan — services are never added, promos never redeemed, usage limits never locked/enforced.
2. **Dashboard** — stat cards only; no today's arrivals/departures, occupancy, revenue, pending payments, recent bookings/payments, or charts.
3. **Staff/roles & guests** — staff/role screens exist (latest migration) but require completion; no guest dedupe/merge.
4. **CMS depth** — no configuration import/export, no revision-history browsing, no autosave.
5. **Localization** — `en/bn/ar/hi` accepted in schema but no translation workflow.
6. **Integrations/ops** — online gateways, S3, SMS/WhatsApp, channel managers deliberately not implemented; backup/restore + deployment docs not yet written (no README at root).

## Suggested execution order

1. Re-establish green baseline (`typecheck`, `lint`, `test`, `build`, HTTP harness) and fix any drift.
2. Money path: domain schemas + admin CRUD for Taxes, Services, Promos; then wire into quote → checkout → `reserve()`/manual booking (BookingService rows, PromoRedemption with promo row lock and per-guest cap, snapshot) with unit tests.
3. Dashboard activity views.
4. Config import/export + revision browsing.
5. Docs (README, deployment, backup/restore) + final full QA pass.
