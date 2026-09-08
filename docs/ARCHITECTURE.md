# Hotel platform architecture

## Scope and delivery gates

The attached 100-section brief is the acceptance specification. This is a new application, not an existing site redesign. A phase is complete only when its implementation and relevant tests pass. Provider contracts do not count as integrations. No default administrator or fabricated production records are created.

1. Architecture: schema, migrations, permissions, CMS/booking/pricing contracts; migration and integrity tests.
2. Authentication/admin: setup, login, session expiry, reset, RBAC, navigation, real dashboard; authorization tests.
3. Hotel/rooms: settings, units, amenities, media; validated CRUD and upload tests.
4. Rates/availability: pricing, restrictions, calendar, blocks; edge-case tests.
5. Booking: checkout, atomic allocation, confirmation, manual booking and lifecycle; contention tests.
6. Payments: enabled offline methods, safe provider adapters, signed/idempotent webhooks, refunds; payment tests.
7. CMS: pages, sections, publishing, menus, theme, media, SEO, forms; public-update and preview tests.
8. CRM/reporting: profiles, reports, exports; totals and authorization tests.
9. Security/performance: threat review, rate limits, uploads, caching, request boundaries.
10. Production QA: build, lint, types, integration, browser, mobile, accessibility, restore drill.

## Structure

`src/app` will contain the Next.js App Router public, setup, account and authenticated admin routes. `src/domain` contains framework-independent invariants. `src/server` contains database access, authentication and application services. `src/ports` defines provider contracts. `src/components` contains UI and CMS renderers. `prisma/migrations` is the authoritative schema history. `tests/database` uses isolated PostgreSQL schemas. `docs` records architecture and operational acceptance.

## Data boundaries

All operational entities are property-owned. Composite foreign keys carry property IDs across booking, guest, room, rate, service, media and ledger relationships to prevent cross-property associations. Users are global; membership supplies a property-scoped role. Every server operation derives membership from the authenticated session, never a submitted role. There is no universal role-name bypass. Role assignments cannot grant permissions the actor does not possess. Published content can be read anonymously; guest data, internal notes and secret references cannot.

Normalize inventory, prices, bookings, payments, refunds, permissions and relationships. Use versioned JSON only for validated presentation documents, rule parameters and immutable financial snapshots. Content collections cover offers, packages, testimonials, galleries, nearby places, FAQ, and blog entries through registered schemas. They do not store live financial ledgers. Promotion eligibility and bookable package amounts belong to pricing/service records.

## Booking and inventory

Local calendar dates use PostgreSQL DATE. A stay is [check-in, check-out), so consecutive guests can share a checkout date. UTC timestamps are reserved for events, sessions and expiry. Property timezone determines today and booking cutoff. Physical unit inventory is the source of truth; do not maintain an independently editable count.

`InventoryNight(unitId,date)` has a primary key shared by bookings, pending holds, maintenance and admin blocks. A check requires exactly one booking-room or block owner. Composite FKs enforce property ownership. Triggers reject wrong-type/out-of-stay allocations and require ledger release when a booking reaches a terminal status. Dates are bounded to prevent unbounded row allocation.

Booking transaction: validate property rules; load authoritative rates, taxes, policies and promos; lock eligible room units in stable ID order; select whole-stay units; insert booking/rooms, every nightly allocation, promo redemption, audit and outbox together. Retry bounded serialization/deadlock conflicts. Roll back the entire transaction on any allocation conflict. Use property/idempotency key uniqueness with request fingerprint comparison. Admin moves, blocks and edits use the same service. Never release the original stay outside the rescheduling transaction.

Pending gateway reservations carry an expiry. A worker locks expired pending bookings, releases inventory, and marks cancelled atomically. Search may trigger this cleanup but must not hide unexpired reservations. A successful callback locks booking and payment: validate provider signature against raw body, amount, currency, merchant reference, and event uniqueness. An expired/cancelled booking cannot be resurrected. Late captured funds create a refund/reconciliation obligation. External payment calls happen outside database transactions, with idempotency keys and outbox recovery.

## Pricing contract

Use exact Decimal arithmetic or integer minor units; never binary floating point for totals. Phase-one monetary storage supports currencies with up to two fractional digits; other currency exponents require an explicit storage/formatting migration before enabling them.

For each night select the rate plan, then the highest-priority applicable override. Equal-priority overlaps must be rejected on writes; use deterministic ID ordering only as a defensive fallback. Weekday, weekend, season, holiday and event rules use the same override engine with explicit priority. Apply occupancy/guest/child/breakfast rules, then length-of-stay and advance/last-minute discounts. Add selected services according to units, apply eligible promo, then included/excluded taxes/fees with a documented rounding order. Persist nightly lines, fees, discounts, tax breakdown, policy and configuration versions in the booking snapshot. Price/policy edits never silently reprice old bookings.

Validate min/max stay, closed/no-arrival/no-departure dates, guest capacity, room limits, same-day cutoff and advance window before quoting and again at reservation. Promo usage limits require locking the promo record in the transaction. Refunds lock payment and check cumulative succeeded plus pending refunds against captured amount.

## CMS contract

Each section has a registered type, version, Zod content schema, allowed style fields, admin editor and server renderer. No arbitrary component paths, CSS, JavaScript or unsanitized HTML from database. Text is escaped; rich text uses a sanitizing allowlist. Embeds use approved origins in sandboxed iframes. Script integrations are explicitly separate, Super Admin-only, consent-gated and CSP-reviewed.

PageSection records represent the working draft. Publishing snapshots the complete page into immutable PageRevision and updates publishedVersion atomically with audit. Public readers use only that revision. Schedule workers publish due revisions, and section visibility uses property-aware timestamps. Reordering uses a transaction with temporary positions to avoid unique collisions. Updates require expected version; conflicts are surfaced rather than overwritten. Preview requires authenticated permission and disables caches/indexing. Configuration namespaces similarly distinguish draft and published values. Schema-validated imports omit all credentials and include a format version.

Global tokens feed CSS variables with validated colors, allowlisted fonts and bounded sizes. Header, footer, navigation, social/contact information, feature toggles and text are configuration-backed. Menus restrict protocols, parent ownership, maximum depth and cycles. Disabled features remove routes/sections cleanly. Custom pages supply title, SEO and structured data; JSON-LD escapes `<`.

## Authentication and security

First-run setup requires a server-generated one-time token and transactional singleton lock. Passwords use scrypt with random salt and bounded parameters. Session cookies contain high-entropy tokens; only token hashes are stored. Cookies are HttpOnly, SameSite=Lax, Secure in production, path=/, with fixed expiry. Mutations enforce trusted Origin and permission server-side. Password resets use short-lived hashed single-use tokens, generic responses and session revocation. Login/reset/setup use persistent rate limits; Redis is an interchangeable shared adapter, not an in-process-only security dependency.

Uploads validate byte limits, signatures and decoded dimensions; random storage keys, quarantine, raster re-encoding and private defaults. SVG/HTML/executable uploads are rejected. Secrets remain in environment or a secret manager referenced by identifier. No raw cards, sensitive ID documents, session tokens or request bodies in logs. Audit writes exclude secrets and unnecessary PII. Structured error codes and request IDs replace public stack traces.

## Integrations and operations

Pay-at-hotel, bank transfer and verified cash are distinct ledger operations. Stripe, SSLCommerz, bKash, Nagad, email/SMS/WhatsApp, storage and channel providers must be implemented and tested before enabling their controls. A declared port is not support. Outbox jobs provide retries, leases, deduplication and dead-letter visibility. Health returns only app/database readiness. Backups include database, media objects and secret-manager configuration independently; restoration is tested on an isolated environment before traffic switch.

Public server rendering minimizes client JavaScript; interactive booking/editor controls form client boundaries. Cache only public published data, invalidated by property/tag on publication. Never cache sessions, checkout availability or guest records as public responses. Reports aggregate settled ledger data with date/currency definitions, pagination and safe exports.

## Sources

Next.js App Router setup: https://nextjs.org/docs/app/getting-started/installation

Prisma custom SQL migration workflow: https://docs.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features
