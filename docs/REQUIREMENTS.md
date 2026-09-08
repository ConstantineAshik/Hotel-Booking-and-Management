# MASTER PROMPT: BUILD A PRODUCTION-READY, FULLY ADMIN-CONTROLLED HOTEL BOOKING PLATFORM

You are a senior full-stack engineer, SaaS architect, UI/UX designer, database engineer, security engineer, DevOps engineer, and QA engineer.

Your task is to build a complete production-ready hotel booking website where virtually the entire website can be managed from an Admin Dashboard without touching source code.

The core rule of this project is:

> NOTHING IMPORTANT ON THE PUBLIC WEBSITE SHOULD REQUIRE CODE CHANGES TO MODIFY.

The admin must be able to control content, design, rooms, pricing, availability, navigation, pages, SEO, policies, booking rules, payment settings, emails, images, colors, typography, sections, homepage layout, footer, contact information, promotions, and other major website behavior from the Admin Dashboard.

Do not build a demo-only website.

Build a properly structured, scalable, secure production application.

Do not proceed to the next major development phase until the current phase is functional and tested.

---

# 1. PROJECT TYPE

Build a modern hotel/resort booking platform.

It should support:

* Single hotel
* Resort
* Boutique hotel
* Guest house
* Multiple room types
* Multiple room inventory
* Seasonal pricing
* Direct online bookings
* Manual bookings
* Admin-created bookings
* Walk-in bookings
* Online/offline payments
* Promo codes
* Website CMS
* Booking management
* Guest management
* Reports
* Website customization

Architect the project so multi-property support can be added later without rebuilding the entire database.

---

# 2. CORE OBJECTIVE

The Admin Dashboard must function as:

* Hotel Management System
* Booking Management System
* Website CMS
* Page Builder
* Pricing Manager
* Availability Manager
* Promotion Manager
* Media Manager
* SEO Manager
* Guest Manager
* Payment Configuration Center
* Email/Notification Manager
* Analytics Dashboard
* User/Staff Permission Manager

The website owner should rarely need a developer after launch.

---

# 3. RECOMMENDED STACK

Use a modern production-ready stack.

Preferred:

Frontend:

* Next.js
* TypeScript
* React
* Tailwind CSS

Backend:

* Next.js server actions/API routes or a properly separated backend architecture
* TypeScript

Database:

* PostgreSQL

ORM:

* Prisma

Authentication:

* Secure session-based authentication
* Admin authentication
* Staff accounts
* Role-based access control

Storage:

* S3-compatible object storage or Cloudinary-compatible architecture

Caching:

* Redis-ready architecture where appropriate

Email:

* Provider abstraction supporting services such as Resend, SendGrid, SMTP, etc.

Payments:
Build a modular payment system.

Support architecture for:

* Cash payment
* Pay at hotel
* Bank transfer
* Manual payment verification
* Card gateway
* Stripe
* SSLCommerz
* bKash
* Nagad
* Other gateways later

Do not tightly couple the application to a single payment provider.

---

# 4. PUBLIC WEBSITE

Create a premium modern responsive hotel website.

Main pages should include:

* Home
* Rooms
* Room details
* Availability search
* Search results
* Booking page
* Checkout
* Booking confirmation
* About
* Gallery
* Facilities / Amenities
* Restaurant
* Services
* Offers
* Packages
* Events
* FAQ
* Contact
* Terms and Conditions
* Privacy Policy
* Cancellation Policy
* Custom dynamic pages

Every page must be manageable through the Admin Dashboard.

---

# 5. HOMEPAGE PAGE BUILDER

The homepage must NOT be hard-coded.

Create a section-based page builder.

Admin should be able to:

* Add section
* Remove section
* Hide section
* Show section
* Duplicate section
* Reorder section through drag-and-drop
* Edit section
* Schedule section visibility
* Change section background
* Change spacing
* Change text alignment
* Configure container width

Possible homepage sections:

* Hero banner
* Hero video
* Search booking widget
* Welcome section
* Featured rooms
* Room categories
* Special offers
* Promotional banner
* Hotel introduction
* Amenities
* Facilities
* Gallery
* Restaurant
* Spa
* Experiences
* Testimonials
* Statistics
* Nearby attractions
* Google Map
* Instagram/social gallery
* Newsletter
* FAQ
* Blog/news
* Call-to-action
* Custom text section
* Custom image section
* Image + text section
* Video section
* Multiple column content section
* HTML/embed section
* Custom cards section

Admin must control which sections exist and their order.

---

# 6. GLOBAL WEBSITE CUSTOMIZATION

Create:

Admin > Website > Appearance

Allow admin to configure:

## Brand

* Hotel name
* Short hotel name
* Logo
* Alternative logo
* Dark logo
* Light logo
* Favicon
* App icon
* Brand description
* Tagline

## Colors

Admin should control:

* Primary color
* Secondary color
* Accent color
* Background color
* Secondary background
* Text color
* Heading color
* Button color
* Button text color
* Link color
* Navigation color
* Footer colors
* Success color
* Warning color
* Error color

Use CSS variables/design tokens so changes apply globally.

## Typography

Admin can select:

* Heading font
* Body font
* Navigation font
* Button font

Control:

* Heading sizes
* Body sizes
* Font weights
* Letter spacing
* Line height

## Layout

Admin can control:

* Maximum content width
* Border radius
* Card radius
* Button radius
* Image radius
* Section spacing
* Header height
* Sticky header
* Boxed/full-width layout where applicable

---

# 7. HEADER BUILDER

Admin > Website > Header

Admin can control:

* Logo
* Logo size
* Header style
* Transparent header
* Sticky header
* Header background
* Header text color
* Booking button
* Booking button label
* Booking button URL
* Phone number
* Email
* Social icons
* Language selector
* Currency selector

Admin should be able to manage navigation.

Navigation Manager:

* Add menu item
* Remove menu item
* Reorder
* Add dropdown
* Nested menu
* Custom URL
* Internal page
* External link
* Open new tab
* Icon
* Hide/show

---

# 8. FOOTER BUILDER

Admin controls:

* Footer logo
* Description
* Contact information
* Phone
* WhatsApp
* Email
* Address
* Google Maps link
* Social profiles
* Copyright text
* Footer menu columns
* Newsletter
* Payment icons
* Awards
* Custom footer sections

Admin can reorder footer columns.

---

# 9. ROOM MANAGEMENT

Admin > Rooms

Create complete room management.

Room fields:

* Room name
* Internal room ID
* Slug
* Room category
* Short description
* Full description
* Featured image
* Gallery
* Video
* Virtual tour URL
* Room size
* Maximum guests
* Adults
* Children
* Beds
* Bed type
* Number of bathrooms
* Floor
* View
* Smoking policy
* Accessibility
* Amenities
* Facilities
* Base price
* Sale price
* Tax
* Service charge
* Security deposit
* Cleaning fee
* Extra guest fee
* Child fee
* Breakfast included
* Refundable/non-refundable
* Minimum stay
* Maximum stay
* Check-in restrictions
* Check-out restrictions
* Inventory
* Available room count
* Status
* Featured/not featured
* SEO settings

Allow room duplication.

---

# 10. PHYSICAL ROOM INVENTORY

Support both:

Room Type

and

Individual Room Units.

Example:

Deluxe King

* Room 101
* Room 102
* Room 103
* Room 104

Admin should be able to:

* Add room number
* Assign room type
* Mark unavailable
* Mark under maintenance
* Mark occupied
* Mark blocked
* Assign guest
* Add internal note

---

# 11. AMENITIES MANAGEMENT

Admin > Amenities

Admin can create custom amenities.

Fields:

* Name
* Icon
* Image
* Description
* Category
* Status

Examples:

* Wi-Fi
* Air conditioning
* Smart TV
* Mini bar
* Balcony
* Sea view
* Breakfast
* Swimming pool
* Gym
* Parking
* Room service

Do not hard-code amenity names.

---

# 12. AVAILABILITY SYSTEM

Build a proper real-time availability engine.

Availability should consider:

* Room inventory
* Existing bookings
* Blocked rooms
* Maintenance
* Minimum stay
* Maximum stay
* Check-in rules
* Check-out rules
* Booking cutoff
* Advance booking limits
* Seasonal restrictions

Search fields:

* Check-in date
* Check-out date
* Adults
* Children
* Rooms

Results should only show available rooms.

Prevent overbooking with database-level protection and transactional booking logic.

---

# 13. AVAILABILITY CALENDAR

Admin > Availability Calendar

Create calendar view.

Display:

* Available rooms
* Booked rooms
* Blocked rooms
* Maintenance
* Pending bookings

Views:

* Daily
* Weekly
* Monthly

Admin can click a room/date and:

* Block
* Unblock
* Change rate
* Change minimum stay
* Mark maintenance
* Create booking

Support bulk changes.

---

# 14. PRICING ENGINE

Admin > Rates & Pricing

Do NOT limit pricing to one static room price.

Support:

* Base price
* Weekend price
* Weekday price
* Seasonal price
* Holiday price
* Event price
* Last-minute rate
* Early booking rate
* Length-of-stay discounts
* Occupancy pricing
* Extra guest pricing
* Child pricing
* Breakfast pricing
* Add-on pricing

Admin can create Rate Plans.

Example:

Standard Rate

Flexible Rate

Non-refundable Rate

Breakfast Included

Honeymoon Package

Corporate Rate

---

# 15. SEASONAL PRICING

Admin can define:

Season name

Start date

End date

Applicable rooms

Price adjustment:

* Fixed amount
* Percentage
* Custom room rate

Priority rules must prevent pricing conflicts.

---

# 16. BOOKING ENGINE

Booking flow:

1. Select dates
2. Select guests
3. Search rooms
4. Select room
5. Select rate
6. Add extras
7. Guest details
8. Apply promo code
9. Payment
10. Booking confirmation

Booking must generate:

* Unique booking reference
* Confirmation page
* Confirmation email
* Admin notification

---

# 17. BOOKING MANAGEMENT

Admin > Bookings

Display:

* Booking ID
* Guest
* Room
* Check-in
* Check-out
* Nights
* Guests
* Amount
* Payment
* Booking status
* Source

Booking statuses:

* Pending
* Confirmed
* Checked-in
* Checked-out
* Cancelled
* No-show

Payment statuses:

* Unpaid
* Partially paid
* Paid
* Refunded
* Partially refunded
* Failed

Admin can:

* Create booking
* Edit booking
* Cancel booking
* Move room
* Change dates
* Change room
* Add guest
* Add service
* Apply discount
* Add payment
* Add internal notes
* Print booking
* Send confirmation
* Check guest in
* Check guest out

---

# 18. MANUAL BOOKINGS

Admin and authorized staff should be able to create reservations manually.

Booking source:

* Website
* Walk-in
* Phone
* WhatsApp
* Facebook
* Agent
* Booking.com
* Agoda
* Expedia
* Other

Allow custom booking source creation.

---

# 19. GUEST MANAGEMENT / CRM

Admin > Guests

Guest profiles should include:

* Name
* Email
* Phone
* WhatsApp
* Address
* Country
* Nationality
* Date of birth
* ID/passport number
* Previous stays
* Upcoming stays
* Total bookings
* Total spent
* Notes
* Tags
* Preferences
* VIP status
* Blacklist status

Avoid storing highly sensitive documents unnecessarily.

If ID files are stored, encrypt/protect them appropriately.

---

# 20. ADD-ONS / EXTRA SERVICES

Admin can create booking extras.

Examples:

* Airport pickup
* Breakfast
* Dinner
* Extra bed
* Room decoration
* Birthday decoration
* Honeymoon package
* Spa
* Laundry
* Late checkout
* Early check-in
* Tour package

Fields:

* Name
* Description
* Image
* Price
* Pricing type
* Per stay
* Per night
* Per person
* Per room
* Quantity
* Available rooms
* Status

---

# 21. PROMO CODES

Admin > Promotions

Admin can create:

* Promo code
* Percentage discount
* Fixed discount
* Free service
* Room-specific offer
* Date-specific offer

Settings:

* Start date
* Expiry
* Usage limit
* Usage per customer
* Minimum booking amount
* Minimum nights
* Applicable rooms
* Applicable rate plans
* New customers only

---

# 22. OFFERS AND PACKAGES

Admin can create promotional packages.

Example:

Honeymoon Package

Weekend Escape

Family Package

Eid Package

New Year Package

Fields:

* Title
* Description
* Images
* Price
* Original price
* Included services
* Date range
* Applicable rooms
* Booking button
* Terms

---

# 23. PAYMENT SYSTEM

Create modular payment configuration.

Admin > Payments

Admin can enable/disable:

* Pay at hotel
* Cash
* Bank transfer
* Card gateway
* SSLCommerz
* bKash
* Nagad
* Stripe

Configuration fields should be securely stored.

Do not expose secrets in frontend code.

Support:

* Full payment
* Partial payment
* Deposit
* Pay later

Admin can configure:

Deposit percentage or fixed amount.

---

# 24. TAXES AND FEES

Admin can configure:

* VAT
* Tourism tax
* Service charge
* City tax
* Cleaning fee
* Booking fee
* Other fees

Each can be:

* Fixed
* Percentage

Allow:

* Included in displayed price
* Added during checkout

---

# 25. CANCELLATION POLICIES

Create dynamic cancellation policies.

Admin can define:

* Free cancellation period
* Cancellation fee
* Non-refundable booking
* Partial refund
* No-show policy

Assign different policies to different rate plans.

---

# 26. EMAIL TEMPLATE BUILDER

Admin > Notifications > Email Templates

Templates:

* Booking confirmation
* New booking admin notification
* Booking cancelled
* Payment confirmation
* Payment failed
* Check-in reminder
* Check-out reminder
* Thank-you message
* Password reset
* Custom email

Admin can edit:

* Subject
* Heading
* Body
* Footer
* Logo
* CTA button

Support variables such as:

{{guest_name}}
{{booking_id}}
{{room_name}}
{{checkin_date}}
{{checkout_date}}
{{amount}}
{{hotel_name}}

---

# 27. WHATSAPP / SMS NOTIFICATION ARCHITECTURE

Create provider abstraction.

Possible future integrations:

* WhatsApp Cloud API
* Twilio
* SMS Gateway
* Local SMS providers

Admin controls notification triggers.

---

# 28. CMS PAGE MANAGER

Admin > Website > Pages

Admin should be able to create unlimited pages.

Fields:

* Page title
* Slug
* SEO title
* Meta description
* Featured image
* Sections
* Status
* Publish date

Use reusable content blocks.

---

# 29. CONTENT BLOCK BUILDER

Support blocks such as:

* Heading
* Text
* Rich text
* Image
* Gallery
* Video
* Button
* Hero
* Columns
* Cards
* FAQ
* Testimonials
* Rooms
* Offers
* Amenities
* Map
* Contact form
* Custom embed

Admin can reorder blocks through drag-and-drop.

---

# 30. GALLERY

Admin > Media > Gallery

Admin can:

* Upload images
* Create albums
* Reorder
* Add titles
* Add descriptions
* Add alt text
* Delete
* Replace
* Optimize

Categories:

* Rooms
* Property
* Restaurant
* Pool
* Events
* Experiences
* Nearby locations

---

# 31. MEDIA LIBRARY

Create WordPress-style media manager.

Features:

* Upload
* Search
* Filter
* Folder/category
* Replace file
* Copy URL
* Image compression
* Alt text
* File information
* Delete unused images if safe

---

# 32. TESTIMONIALS

Admin can add:

* Guest name
* Country
* Review
* Rating
* Image
* Source
* Featured status

Admin controls homepage testimonials.

---

# 33. FAQ MANAGER

Admin can:

* Add FAQ
* Edit
* Delete
* Reorder
* Categorize
* Hide/show

---

# 34. CONTACT SETTINGS

Admin controls:

* Address
* Phone
* Secondary phone
* WhatsApp
* Email
* Reservation email
* Google Maps
* Longitude
* Latitude
* Facebook
* Instagram
* TikTok
* YouTube
* TripAdvisor
* LinkedIn

---

# 35. CONTACT FORM

Contact form submissions must be saved in admin.

Admin can:

* Read message
* Mark resolved
* Delete
* Reply externally
* Add notes

Spam protection required.

---

# 36. HOTEL SETTINGS

Admin > Settings > Hotel

Fields:

* Hotel name
* Legal name
* Address
* Coordinates
* Phone
* Email
* Currency
* Timezone
* Check-in time
* Check-out time
* Minimum booking notice
* Maximum advance booking
* Child age rules
* Infant rules
* Tax information
* Registration details

---

# 37. CURRENCY

Allow admin to select default currency.

Architecture should support future multi-currency.

Currency symbol and formatting must not be hard-coded.

---

# 38. LANGUAGE

Architecture should support multilingual content.

Admin can select primary language.

Prepare translation structure.

Potential languages:

* English
* Bengali
* Arabic
* Hindi
* Others

Do not hard-code frontend strings throughout components.

---

# 39. SEO MANAGEMENT

Admin controls SEO globally and per page.

Global SEO:

* Website title
* Default meta description
* Keywords
* OG image
* Twitter image
* Index settings

Per-page:

* SEO title
* Meta description
* Canonical URL
* OG image
* Robots settings

Generate:

* sitemap.xml
* robots.txt
* structured data

Add hotel schema markup.

---

# 40. CUSTOM CODE SETTINGS

For advanced owners:

Admin > Website > Custom Code

Allow controlled addition of:

* Header scripts
* Body scripts
* Footer scripts

Potential uses:

* Google Analytics
* Tag Manager
* Meta Pixel
* Third-party chat

Restrict this feature to Super Admin.

Sanitize where appropriate.

---

# 41. ANALYTICS

Admin Dashboard should show:

* Total bookings
* Today's bookings
* Upcoming check-ins
* Today's check-ins
* Today's check-outs
* Revenue
* Outstanding payments
* Occupancy rate
* Cancellation rate
* Average booking value
* Average daily rate
* Revenue per available room
* Most booked rooms
* Booking sources

Date filters:

* Today
* Yesterday
* 7 days
* 30 days
* Month
* Year
* Custom

---

# 42. REPORTS

Admin > Reports

Reports:

* Booking report
* Revenue report
* Payment report
* Tax report
* Occupancy report
* Room performance
* Cancellation report
* Guest report
* Promo usage
* Booking source report

Export:

* CSV
* Excel
* PDF/print-friendly view

---

# 43. ADMIN DASHBOARD UI

Create a professional desktop-first responsive administration system.

Sidebar:

Dashboard

Bookings

Calendar

Rooms

Room Units

Rates

Availability

Guests

Payments

Promotions

Offers

Services

Website

* Pages
* Homepage
* Navigation
* Header
* Footer
* Appearance

Media

* Library
* Gallery

Content

* Amenities
* Testimonials
* FAQ
* Nearby Places

Reports

Notifications

Users

Settings

Do not overload each page.

Use clean information architecture.

---

# 44. ADMIN ROLES

Create RBAC.

Roles:

Super Admin

Administrator

Manager

Receptionist

Booking Manager

Accountant

Content Manager

Custom Role

Permissions should be granular.

Examples:

booking.view

booking.create

booking.edit

booking.cancel

guest.view

payments.view

payments.edit

website.edit

rooms.edit

reports.view

users.manage

settings.manage

Admin can create custom roles.

---

# 45. AUDIT LOGS

Record important actions.

Examples:

* Booking changed
* Price changed
* Booking cancelled
* Payment edited
* User created
* Room deleted
* Website settings changed

Record:

* User
* Action
* Time
* IP when appropriate
* Before value
* After value

---

# 46. SEARCH

Admin global search should search:

* Booking ID
* Guest
* Phone
* Email
* Room
* Payment reference

Public website search can search:

* Rooms
* Offers
* Pages
* Services

---

# 47. BOOKING DETAIL PAGE

Admin booking screen should show:

Guest details

Room details

Stay dates

Booking summary

Nightly pricing breakdown

Taxes

Discounts

Extras

Payments

Balance

Booking timeline

Internal notes

Email history

Status history

Actions

---

# 48. RECEIPT / INVOICE

Generate printable:

* Booking confirmation
* Invoice
* Receipt

Admin can customize:

* Logo
* Hotel information
* Footer
* Tax information
* Terms

Invoice numbering should be configurable.

---

# 49. CHECK-IN / CHECK-OUT

Admin booking management should support:

Check-in:

* Verify guest
* Assign room
* Take deposit
* Add note

Check-out:

* Review charges
* Add services
* Take final payment
* Mark checked-out
* Generate invoice

---

# 50. MAINTENANCE MODE

Admin can enable website maintenance mode.

Configure:

* Title
* Message
* Image
* Estimated reopening text
* Contact details

Admin interface must remain accessible.

---

# 51. WEBSITE ANNOUNCEMENT BAR

Admin can enable announcement banner.

Settings:

* Message
* Link
* Background
* Text color
* Start date
* End date
* Dismissible

---

# 52. POPUP MANAGER

Admin can create popup:

* Promotion
* Newsletter
* Announcement

Configure:

* Title
* Text
* Image
* CTA
* Trigger delay
* Frequency
* Date range

---

# 53. COOKIE CONSENT

Create customizable cookie consent.

Admin controls:

* Message
* Policy URL
* Button labels
* Tracking behavior where required

---

# 54. SOCIAL MEDIA

Admin can manage social links.

Never hard-code social URLs.

---

# 55. NEARBY PLACES

Admin can create nearby attraction entries.

Fields:

* Name
* Description
* Image
* Distance
* Travel time
* Map URL
* Category

Examples:

* Airport
* Beach
* Tourist attraction
* Shopping mall
* Hospital
* Restaurant

---

# 56. BLOG / NEWS

Optional but architect it into the CMS.

Admin can manage:

* Posts
* Categories
* Tags
* Author
* Images
* SEO
* Publish date

---

# 57. FORM BUILDER

Create a simple form system where admin can create:

* Contact form
* Event inquiry
* Wedding inquiry
* Corporate booking inquiry

Field types:

* Text
* Email
* Phone
* Textarea
* Number
* Dropdown
* Checkbox
* Date

Save submissions in admin.

---

# 58. CUSTOMIZATION PRINCIPLE

Any repeated text shown publicly should come from one of:

* Database
* CMS
* Translation file
* Site configuration

Avoid strings scattered throughout components.

The goal is maximum control without code editing.

---

# 59. DATABASE ARCHITECTURE

Design normalized tables/models including concepts like:

User

Role

Permission

HotelSettings

SiteSettings

ThemeSettings

Page

PageSection

Menu

MenuItem

RoomType

RoomUnit

Amenity

RoomAmenity

RatePlan

Season

RateOverride

AvailabilityBlock

Booking

BookingRoom

Guest

Payment

Refund

Service

BookingService

PromoCode

Offer

Tax

Fee

Policy

Media

Gallery

Testimonial

FAQ

ContactSubmission

EmailTemplate

Notification

AuditLog

BlogPost

BlogCategory

CustomForm

FormSubmission

Use proper:

* Foreign keys
* Unique constraints
* Indexes
* Transactions
* Soft deletion where appropriate

---

# 60. BOOKING TRANSACTION SAFETY

This is extremely important.

Prevent double booking.

When confirming a booking:

* Validate inventory
* Lock/check required availability
* Create reservation transactionally
* Process payment safely
* Finalize reservation

If payment fails:

Do not incorrectly occupy room inventory permanently.

Handle concurrent booking attempts correctly.

---

# 61. PAYMENT SECURITY

Never store raw card details.

Never expose:

* Secret keys
* Private tokens
* Gateway secrets

Validate payment webhooks.

Make webhook handlers idempotent.

---

# 62. AUTHENTICATION SECURITY

Admin system must have:

* Secure password hashing
* Session expiration
* CSRF protection where required
* Rate limiting
* Login attempt protection
* Secure cookies
* Password reset
* Email verification where appropriate

Optional later:

* 2FA

---

# 63. APPLICATION SECURITY

Protect against:

* SQL injection
* XSS
* CSRF
* IDOR
* File upload attacks
* Malicious URLs
* Privilege escalation
* Brute force
* Overbooking race conditions

Perform server-side validation for every important action.

Never trust frontend validation alone.

---

# 64. VALIDATION

Use a schema-validation library.

Validate:

* Booking dates
* Guest counts
* Prices
* Payments
* Promo codes
* Emails
* Phone numbers
* Admin inputs
* Uploaded files

---

# 65. ERROR HANDLING

Create proper error states.

Never expose server stack traces publicly.

Create:

* 404
* 403
* 500
* Booking unavailable
* Payment failed
* Expired session

Provide useful user messages.

---

# 66. PERFORMANCE

Optimize:

* Images
* Database queries
* Lazy loading
* Caching
* Fonts
* Static content
* API calls

Avoid unnecessary client-side JavaScript.

Public pages should load quickly.

---

# 67. IMAGE OPTIMIZATION

Upload images once.

Automatically provide optimized versions where possible.

Use:

* Lazy loading
* Responsive sizes
* WebP/AVIF where supported

Admin should be able to configure alt text.

---

# 68. MOBILE EXPERIENCE

The customer-facing website must be designed mobile-first.

Booking must be easy on small screens.

Important controls must remain reachable.

Avoid:

* Tiny buttons
* Horizontal overflow
* Oversized modals
* Huge hero sections
* Difficult date selectors

---

# 69. ACCESSIBILITY

Follow WCAG principles.

Include:

* Keyboard navigation
* Proper contrast
* Form labels
* Alt text
* Focus states
* ARIA where needed

---

# 70. DESIGN DIRECTION

Public site should look:

* Premium
* Elegant
* Minimal
* Hotel-focused
* Luxurious
* Trustworthy

Avoid generic SaaS appearance.

Use:

* High-quality photography
* Spacious layouts
* Strong typography
* Subtle animations
* Elegant booking widgets

Animation must not reduce performance.

---

# 71. ADMIN UX

Admin screens should prioritize productivity.

Use:

* Tables
* Filters
* Search
* Pagination
* Bulk actions
* Date filters
* Status badges
* Drawers/modals where appropriate
* Confirmation dialogs for destructive actions

---

# 72. AUTO SAVE / DRAFTS

CMS content should support:

* Draft
* Published
* Scheduled

Consider autosave for long editing sessions.

---

# 73. PREVIEW MODE

Allow admin to preview website changes before publishing.

Especially:

* Homepage
* Pages
* Promotions
* Theme settings

---

# 74. VERSION HISTORY

For important CMS content, maintain basic revision history.

Allow admin to view previous versions.

---

# 75. BACKUP READY

Prepare architecture for:

* Automated DB backup
* Media backup
* Environment configuration backup

Document restoration process.

---

# 76. SETTINGS IMPORT / EXPORT

Create a settings export system.

Admin can export website configuration as JSON.

Allow validated restore/import.

Do not export secrets.

---

# 77. INITIAL SETUP WIZARD

When app runs for the first time, create setup wizard:

Step 1:
Hotel information

Step 2:
Admin account

Step 3:
Currency/timezone

Step 4:
Check-in/check-out settings

Step 5:
Payment setup

Step 6:
Create first room

Step 7:
Branding

Step 8:
Launch

---

# 78. DEMO / SEED DATA

Create optional seed data.

Include:

* Rooms
* Amenities
* Offers
* Testimonials
* Homepage content

Allow seed data to be removed safely.

---

# 79. TESTING

Write tests for critical systems.

Especially:

* Availability
* Booking creation
* Double-booking prevention
* Pricing
* Promo calculation
* Taxes
* Authentication
* Permissions
* Payment state
* Cancellation

Also perform:

* Mobile testing
* Desktop testing
* Form validation testing
* API authorization testing

---

# 80. ADMIN DASHBOARD INITIAL SCREEN

Dashboard cards:

Today's Check-ins

Today's Check-outs

New Bookings

Total Occupancy

Pending Payments

Today's Revenue

Monthly Revenue

Then show:

Occupancy chart

Revenue chart

Recent bookings

Upcoming arrivals

Recent payments

Room status

---

# 81. COMMAND PALETTE

Optional productivity feature:

Ctrl/Cmd + K

Actions:

* Create booking
* Search booking
* Search guest
* Add room
* Open calendar
* Open settings

---

# 82. DATABASE SEED ADMIN

Never ship production default passwords.

Use environment setup or first-run admin creation.

---

# 83. ENVIRONMENT CONFIGURATION

Provide `.env.example`.

Include all required variables with descriptions.

Never commit secrets.

---

# 84. DOCUMENTATION

Create README containing:

* Requirements
* Installation
* Database setup
* Environment variables
* Local development
* Build
* Deployment
* Admin setup
* Payment setup
* Email setup
* Storage setup
* Backup instructions

---

# 85. DEPLOYMENT

Make project deployment-ready.

Possible deployment architecture:

Frontend/backend:

* Vercel
* VPS
* Docker

Database:

* PostgreSQL

Storage:

* S3-compatible provider

Provide Docker support if useful.

---

# 86. HEALTH CHECK

Create health endpoint for deployment monitoring.

Check:

* App
* Database

Do not expose sensitive system details.

---

# 87. LOGGING

Implement structured server logs for:

* Errors
* Payments
* Booking errors
* Background tasks

Never log sensitive secrets.

---

# 88. WEBSITE SETTINGS SEARCH

Because there will be many controls, provide admin settings search.

Examples:

Searching "logo" should show branding settings.

Searching "check-in" should show hotel settings.

Searching "color" should show appearance settings.

---

# 89. GLOBAL CMS SEARCH

Admin should be able to quickly search:

* Pages
* Rooms
* Bookings
* Guests
* Offers
* Media
* Settings

---

# 90. FEATURE TOGGLE SYSTEM

Create admin feature toggles.

Examples:

* Blog
* Restaurant page
* Spa
* Testimonials
* Offers
* Newsletter
* Popup
* Multi-language
* Online payment

Disabled features should disappear cleanly.

---

# 91. PUBLIC WEBSITE SETTINGS

Admin can control things like:

* Whether prices show publicly
* Whether booking is enabled
* Whether booking requires payment
* Whether unavailable rooms show
* Whether taxes show separately
* Whether room inventory count shows
* Whether guest reviews appear

---

# 92. BOOKING CONFIGURATION

Admin should control:

* Maximum rooms per booking
* Maximum adults
* Maximum children
* Minimum stay
* Booking cutoff
* Same-day booking
* Maximum future booking date
* Deposit requirement
* Default cancellation policy
* Booking confirmation behavior

---

# 93. DATE-SPECIFIC RESTRICTIONS

Admin can configure dates as:

* Closed
* No check-in
* No check-out
* Minimum stay
* Maximum stay
* Custom price

---

# 94. HOUSEKEEPING READY ARCHITECTURE

Prepare database for future housekeeping module.

Possible room states:

* Clean
* Dirty
* Cleaning
* Inspected
* Maintenance

This does not need to be the first MVP priority but architecture must not block it.

---

# 95. FUTURE CHANNEL MANAGER SUPPORT

Structure the system so integrations with:

* Booking.com
* Agoda
* Expedia
* Airbnb

can later be added through adapters/API services.

Do not pretend to support them unless actually implemented.

---

# 96. SUPER ADMIN CONTROL

Super Admin should be able to control virtually all website functionality.

However:

Do NOT let ordinary admins edit:

* Environment secrets
* Database credentials
* Critical infrastructure keys

Those remain protected in server environment variables.

"Everything from admin" means everything that is reasonable and safe to expose through an admin system.

---

# 97. CHANGE SAFETY

For dangerous operations:

* Delete room
* Cancel paid booking
* Delete guest
* Reset website
* Change major financial settings

Require confirmation.

For very destructive operations, consider asking admin to type confirmation text.

---

# 98. EMPTY STATES

Every admin module needs useful empty states.

Example:

"No rooms created yet."

Button:

"Create your first room"

Do not leave blank tables.

---

# 99. LOADING STATES

Use:

* Skeletons
* Loading states
* Disabled buttons during save
* Toast messages

Prevent duplicate submissions.

---

# 100. FINAL PRODUCTION REQUIREMENTS

Before declaring the project complete, verify:

* Public site works
* Admin works
* Admin controls public content
* Room inventory works
* Pricing works
* Availability works
* Booking works
* Confirmation works
* Payment logic works
* Permissions work
* Mobile works
* SEO works
* Images optimized
* No exposed secrets
* No obvious security vulnerabilities
* Database migrations work
* Build succeeds
* No TypeScript errors
* No major console errors

---

# DEVELOPMENT WORKFLOW

Do not randomly build files.

Follow these phases.

## PHASE 1 — ARCHITECTURE

Complete:

* Requirements
* Folder structure
* Database schema
* Permission design
* CMS architecture
* Booking architecture
* Pricing architecture

Test database migrations.

Do not proceed until stable.

## PHASE 2 — AUTHENTICATION + ADMIN SHELL

Complete:

* Login
* Sessions
* Roles
* Permissions
* Admin navigation
* Base dashboard

Test security.

## PHASE 3 — HOTEL + ROOM MANAGEMENT

Complete:

* Hotel settings
* Room types
* Room units
* Amenities
* Media uploads

Test CRUD.

## PHASE 4 — PRICING + AVAILABILITY

Complete:

* Rates
* Seasonal pricing
* Calendar
* Inventory
* Availability search

Test edge cases.

## PHASE 5 — BOOKING ENGINE

Complete:

* Search
* Selection
* Checkout
* Reservation
* Confirmation
* Admin booking management

Test double-booking prevention.

## PHASE 6 — PAYMENT

Complete modular payment architecture.

Test success/failure/cancel states.

## PHASE 7 — CMS

Complete:

* Pages
* Homepage
* Section builder
* Navigation
* Header
* Footer
* Appearance
* SEO
* Media

Verify public content updates without code changes.

## PHASE 8 — CRM + REPORTING

Complete:

* Guests
* Reports
* Analytics
* Exports

## PHASE 9 — SECURITY + PERFORMANCE

Perform security review and optimization.

## PHASE 10 — PRODUCTION QA

Run:

* Type check
* Lint
* Build
* Tests
* Booking tests
* Permission tests
* Responsive tests

Fix all blocking problems before considering the project finished.

---

# VERY IMPORTANT DEVELOPMENT RULES

Do not:

* Build fake buttons
* Use static admin dashboards
* Hard-code sample booking results
* Create buttons without functionality
* Hard-code rooms
* Hard-code prices
* Hard-code navigation
* Hard-code hotel contact information
* Leave TODOs for critical features
* Ignore mobile
* Ignore validation
* Ignore authorization
* Store secrets in frontend
* Skip booking concurrency protection
* Claim integrations are working when they are not

Whenever you create an Admin setting, connect it to the public website.

If the admin changes something, the website should actually reflect that change.

---

# FINAL PRINCIPLE

The goal is to create a hotel booking platform where an owner can run and redesign most of the website from the Admin Dashboard.

They should be able to:

Change hotel information.

Change logo.

Change fonts.

Change colors.

Change homepage.

Reorder homepage.

Create pages.

Change navigation.

Change footer.

Upload media.

Create rooms.

Change prices.

Control availability.

Block rooms.

Create seasonal rates.

Create discounts.

Manage bookings.

Create manual bookings.

Manage guests.

Manage payments.

Create offers.

Configure booking rules.

Edit cancellation policies.

Edit emails.

Configure SEO.

View reports.

Manage staff.

Control permissions.

Enable/disable features.

All without changing code.

Build the system with this principle from the database level upward, not as an afterthought.
