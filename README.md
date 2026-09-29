# Finora Growth Hub

============================================================

FINORA — ULTRA PREMIUM FULL-STACK FINTECH PLATFORM

MASTER DEVELOPMENT PROMPT

============================================================

You are an elite team consisting of:

- Senior Product Designer

- Fintech UX/UI Designer

- Full-Stack Engineer

- Backend Engineer

- Database Architect

- Security Engineer

- DevOps Engineer

- QA Engineer

- Product Architect

Your task is to build a complete, high-end, production-grade web application called:

                         FINORA

FINORA must look and feel like a premium international fintech/investment platform.

This must NOT look like:

- a basic AI-generated dashboard

- a template website

- a cheap crypto website

- a generic admin panel

- a simple CRUD application

It should feel like a serious product designed by a professional international fintech product team.

The application must include:

PUBLIC WEBSITE

AUTHENTICATION

USER DASHBOARD

INVESTMENT SYSTEM

WALLET

DEPOSIT SYSTEM

WITHDRAWAL SYSTEM

REFERRAL SYSTEM

NOTIFICATION SYSTEM

SUPPORT SYSTEM

PROFILE

ADMIN CONTROL CENTER

DATABASE

BACKEND

SECURITY

AUDIT LOGS

SETTINGS

WEBSITE CONTENT MANAGEMENT

The admin panel MUST be inside the same application:

/admin

Do NOT build the admin as a completely separate project.

============================================================

1. TECHNOLOGY STACK

============================================================

Use a modern production-ready architecture.

Preferred stack:

Frontend:

- Next.js

- React

- TypeScript

- Tailwind CSS

- shadcn/ui or an equivalent premium component system

Backend:

- Next.js server-side APIs / Server Actions

Database:

- PostgreSQL

- Supabase is preferred if available

Authentication:

- Secure authentication

- Email/password

- Password reset

- Email verification where supported

Storage:

- Secure private object storage

Deployment:

- Vercel-compatible

Use environment variables for secrets.

NEVER expose private API keys, database credentials, service-role keys, or secrets in frontend code.

============================================================

2. BRAND IDENTITY

============================================================

Brand Name:

FINORA

The brand must feel:

- International

- Financial

- Premium

- Modern

- Trustworthy

- Professional

- Minimal

- Technology-driven

Logo concept:

Create a custom FINORA wordmark with a distinctive "F" symbol.

The symbol should work independently as an app icon.

Do NOT use:

- generic dollar signs

- copied banking logos

- stock icons as the primary logo

- childish graphics

Brand colors:

Primary:

Deep Navy / Midnight

Accent:

Emerald / Financial Green

Secondary:

White

Soft Gray

Muted Slate

Use subtle gradients and glass effects only where they improve the interface.

The visual language should resemble a premium financial product.

============================================================

3. DESIGN SYSTEM

============================================================

Create a complete reusable design system.

Include:

Buttons

Inputs

Dropdowns

Tabs

Cards

Tables

Modals

Drawers

Badges

Charts

Alerts

Toasts

Tooltips

Navigation

Breadcrumbs

Pagination

Skeleton loaders

Empty states

Error states

Use consistent:

Typography

Spacing

Border radius

Shadows

Icons

Transitions

Colors

Avoid excessive rounded cards.

Avoid excessive gradients.

Avoid unnecessary animations.

Every component should feel polished.

============================================================

4. PUBLIC WEBSITE

============================================================

Create a premium public website.

Routes:

/

/about

/plans

/faq

/contact

/terms

/privacy

/risk-disclosure

/login

/signup

Homepage sections:

1. Hero

2. Platform Overview

3. Investment Plans

4. How FINORA Works

5. Key Features

6. Security / Transparency

7. FAQ

8. Call To Action

9. Footer

Hero:

FINORA

Create a strong professional headline related to smarter financial growth.

Do not use unsupported claims such as:

"Guaranteed profits"

"Risk-free income"

"Guaranteed daily returns"

All financial claims must be based on actual configured terms.

CTA:

Explore Plans

Create Account

============================================================

5. AUTHENTICATION

============================================================

Routes:

/login

/signup

/forgot-password

/reset-password

Signup fields:

Full Name

Email

Phone Number

Password

Confirm Password

Referral Code (optional)

Implement:

Password validation

Secure password hashing

Session management

Authentication state

Logout

Password reset

Email verification where supported

Protect all authenticated routes.

A normal user MUST NOT be able to access:

/admin

Admin authorization must be checked server-side.

============================================================

6. USER NAVIGATION

============================================================

Main user navigation:

HOME

INVEST

WALLET

REFERRALS

PROFILE

Additional:

Notifications

Support

Transactions

Investment History

Security

Logout

Desktop:

Use a premium sidebar/top navigation.

Mobile:

Use bottom navigation:

Home

Invest

Wallet

Referrals

Profile

============================================================

7. USER HOME DASHBOARD

============================================================

Route:

/dashboard

Create a premium financial dashboard.

Header:

FINORA

"Good morning, [User Name]"

Notification icon

Profile avatar

Main financial overview:

Total Balance

Available Balance

Invested Amount

Pending Balance

Total Earnings

Quick actions:

Deposit

Withdraw

Invest

Refer

Sections:

Portfolio Overview

Active Investments

Earnings Overview

Recent Transactions

Investment Activity

Referral Summary

Notifications

Charts must use actual database data.

NEVER generate fake financial numbers in production.

If there is no data:

Show a professional empty state.

============================================================

8. FINORA INVESTMENT PLANS

============================================================

FINORA MUST initially contain exactly these 6 plans:

---

PLAN 1

---

Plan Name:

Starter

Investment:

PKR 2,700

Daily Earning:

PKR 300/day

---

PLAN 2

---

Plan Name:

Basic

Investment:

PKR 5,400

Daily Earning:

PKR 600/day

---

PLAN 3

---

Plan Name:

Growth

Investment:

PKR 10,800

Daily Earning:

PKR 1,200/day

---

PLAN 4

---

Plan Name:

Premium

Investment:

PKR 21,600

Daily Earning:

PKR 2,400/day

---

PLAN 5

---

Plan Name:

Pro

Investment:

PKR 43,200

Daily Earning:

PKR 4,800/day

---

PLAN 6

---

Plan Name:

Elite

Investment:

PKR 86,400

Daily Earning:

PKR 9,600/day

============================================================

9. PLAN DISPLAY TABLE

============================================================

The plans must be represented initially as:

1. Starter — PKR 2,700 — PKR 300/day

2. Basic — PKR 5,400 — PKR 600/day

3. Growth — PKR 10,800 — PKR 1,200/day

4. Premium — PKR 21,600 — PKR 2,400/day

5. Pro — PKR 43,200 — PKR 4,800/day

6. Elite — PKR 86,400 — PKR 9,600/day

IMPORTANT:

These must be stored in the database.

Do NOT hardcode them permanently into frontend components.

Admin must be able to manage them dynamically.

============================================================

10. PLAN MANAGEMENT

============================================================

Admin route:

/admin/investment-plans

Admin can:

Create Plan

Edit Plan

Enable Plan

Disable Plan

Archive Plan

Reorder Plans

Feature Plan

Edit Description

Edit Investment Amount

Edit Daily Earning / Return Terms

Edit Duration

Edit Fees

Edit Risk Disclosure

Edit Terms

Each plan must contain:

ID

Name

Slug

Description

Minimum Investment

Maximum Investment

Investment Amount

Daily Earning / Return Terms

Return Type

Duration

Currency

Fees

Risk Level

Terms

Disclosure

Status

Featured

Display Order

Created At

Updated At

Existing investments must preserve the terms applicable when they were created.

Do NOT retroactively change historical investment terms when an admin edits a plan.

============================================================

11. PLAN CARDS

============================================================

Create premium plan cards.

Example:

STARTER

PKR 2,700

Daily Earning

PKR 300/day

Duration

[Configured Duration]

Status

Active

Buttons:

VIEW DETAILS

INVEST NOW

Repeat for all six plans.

Each plan should have its own subtle visual identity while maintaining one FINORA design system.

Premium / Pro / Elite can have stronger visual emphasis, but avoid exaggerated graphics.

============================================================

12. PLAN DETAIL PAGE

============================================================

When user selects a plan:

Show:

Plan Name

Investment Amount

Daily Earning / Return Terms

Duration

Potential/Configured Outcome

Fees

Risk Information

Terms

Important Disclosure

Investment amount:

Show selected amount clearly.

Before confirmation:

Display a full investment summary.

Example:

Plan:

Starter

Investment:

PKR 2,700

Daily Earning / Return:

PKR 300/day

Duration:

[Configured]

Fees:

[Configured]

Risk:

[Configured]

Require:

"I have read and agree to the investment terms and disclosure."

Then:

CONFIRM INVESTMENT

IMPORTANT:

Do not label returns as "guaranteed" unless the underlying legal/business arrangement actually supports that claim.

============================================================

13. ACTIVE INVESTMENTS

============================================================

Route:

/investments

Tabs:

Active

Pending

Completed

Cancelled

Each investment displays:

Investment ID

Plan

Investment Amount

Daily Earning / Return Terms

Start Date

End Date

Status

Current Performance

Last Updated

Investment details:

Overview

Timeline

Terms

Transactions

Performance

============================================================

14. WALLET

============================================================

Route:

/wallet

Display:

Total Balance

Available Balance

Invested Balance

Pending Balance

Actions:

DEPOSIT

WITHDRAW

Transaction history:

Deposits

Withdrawals

Investments

Returns / Performance

Referral Commissions

Fees

Adjustments

Every transaction must show:

Transaction ID

Type

Amount

Status

Date

Time

Description

Statuses:

Pending

Processing

Completed

Rejected

Cancelled

============================================================

15. DEPOSIT SYSTEM

============================================================

There must be ONE active deposit payment method.

User route:

/wallet/deposit

Display:

Deposit Amount

Payment Method

QR Code

Account Name

Account Number

Payment Instructions

Admin controls the payment information.

Admin can change:

QR Code

Payment Method

Account Name

Account Number

Instructions

Minimum Deposit

Maximum Deposit

Configurable fields:

Transaction ID Required

Screenshot Required

User flow:

1. User enters amount

2. User views QR/payment information

3. User makes payment externally

4. User enters Transaction ID

5. User uploads payment screenshot

6. User submits request

7. Status becomes:

PENDING VERIFICATION

Display:

"Your deposit has been submitted and is awaiting verification."

============================================================

16. ADMIN DEPOSIT VERIFICATION

============================================================

Route:

/admin/deposits

Table:

Deposit ID

User

Amount

Payment Method

Transaction ID

Screenshot

Date

Status

Admin opens details.

Display:

User Profile

Amount

Payment Method

Transaction ID

Screenshot

Submission Date

Time

Actions:

APPROVE

REJECT

Reject requires a reason.

When approved:

1. Verify deposit

2. Update deposit status

3. Create ledger entry

4. Update wallet according to approved transaction

5. Trigger investment activation when applicable

6. Create transaction record

7. Send user notification

8. Create admin audit log

All operations must be atomic.

Prevent duplicate approval.

When rejected:

Store:

Rejection Reason

Admin

Timestamp

Send notification to user.

============================================================

17. WITHDRAWAL SYSTEM

============================================================

Route:

/wallet/withdraw

Supported methods:

Easypaisa

JazzCash

UPaisa

Bank Account

Admin can enable/disable methods.

Mobile wallet fields:

Account Title

Mobile Number

Bank fields:

Account Title

Bank Name

Account Number

IBAN where applicable

User enters:

Withdrawal Amount

Display:

Available Balance

Withdrawal Amount

Fee if applicable

Final Amount

Require confirmation before submission.

============================================================

18. WITHDRAWAL WORKFLOW

============================================================

Status flow:

PENDING

↓

UNDER REVIEW

↓

APPROVED

↓

PAID

Alternative:

PENDING

↓

REJECTED

Admin route:

/admin/withdrawals

Table:

Withdrawal ID

User

Amount

Method

Account Details

Requested Date

Status

Admin actions:

Approve

Reject

Mark as Paid

Reject requires reason.

Mark Paid requires explicit confirmation.

Only authorized admins can change withdrawal status.

Never tell the user that payment was completed unless it has actually been marked Paid.

============================================================

19. REFERRAL SYSTEM

============================================================

Route:

/referrals

Display:

Referral Code

Referral Link

Total Referrals

Active Referrals

Referral Earnings

Referral History

Buttons:

Copy Code

Copy Link

Share

History:

Referred User

Date

Qualification

Commission

Status

Admin settings:

Referral System:

ON/OFF

Commission Type:

Configurable

Commission Percentage:

Configurable

Minimum Qualifying Investment:

Configurable

Referral rules:

Editable

Referral calculations must happen server-side.

============================================================

20. NOTIFICATION SYSTEM

============================================================

Create a premium notification center.

User receives automatic notifications for:

Deposit Submitted

Deposit Approved

Deposit Rejected

Investment Activated

Investment Completed

Withdrawal Submitted

Withdrawal Approved

Withdrawal Rejected

Withdrawal Paid

Referral Commission

New Investment Plan

System Announcement

Notification fields:

Title

Message

Timestamp

Read/Unread

Optional Link

Show unread badge in navigation.

============================================================

21. ADMIN NOTIFICATIONS

============================================================

Route:

/admin/notifications

Admin can send notifications to:

All Users

Selected Users

User Groups

Groups:

All Users

Active Investors

Pending Deposit Users

Pending Withdrawal Users

Fields:

Title

Message

Optional Link

Include preview.

Store every notification in the database.

============================================================

22. SUPPORT SYSTEM

============================================================

User route:

/support

Create ticket.

Fields:

Subject

Category

Message

Attachment

Statuses:

Open

In Progress

Waiting for User

Resolved

Closed

Admin:

/admin/support

Admin can:

View

Reply

Change Status

Close

Reopen

Store complete conversation history.

============================================================

23. USER PROFILE

============================================================

Route:

/profile

Display:

Profile Picture

Full Name

Email

Phone

User ID

Registration Date

Referral Code

Settings:

Edit Profile

Change Password

Notification Preferences

Security

Sessions

Logout

Where supported:

Two-factor authentication

Login history

Active sessions

============================================================

24. ADMIN PANEL

============================================================

Admin route:

/admin

Create a premium command-center interface.

Sidebar:

Dashboard

Users

Deposits

Withdrawals

Investment Plans

Active Investments

Referrals

Transactions

Notifications

Support

Website Content

Settings

Admin Activity Logs

Header:

Global Search

Notifications

Admin Profile

============================================================

25. ADMIN DASHBOARD

============================================================

Display real database metrics:

Total Users

Active Users

Pending Deposits

Approved Deposits

Pending Withdrawals

Total Deposits

Total Withdrawals

Total Invested

Active Investments

Referral Commissions

Charts:

Deposits vs Withdrawals

New Users

Investment Activity

Transaction Activity

Pending Actions:

Deposits awaiting verification

Withdrawals awaiting review

Support tickets awaiting response

Every metric must come from the database.

No fake production numbers.

============================================================

26. ADMIN USERS

============================================================

Route:

/admin/users

Table:

User ID

Name

Email

Phone

Status

Balance

Invested

Active Investments

Referral Count

Registration Date

Filters:

Search

Status

Date

Investment Status

User detail:

Profile

Wallet

Deposits

Withdrawals

Investments

Earnings

Referrals

Transactions

Notifications

Activity

Admin actions:

Activate

Suspend

View

Send Notification

============================================================

27. BALANCE ADJUSTMENT

============================================================

Never provide a simple editable balance field.

If a legitimate administrative adjustment is required:

Admin selects:

User

Amount

Credit/Debit

Reason

Require confirmation.

Create:

Ledger Entry

Transaction

Audit Log

The adjustment must be traceable.

============================================================

28. TRANSACTION LEDGER

============================================================

Create a proper financial ledger.

Types:

DEPOSIT

WITHDRAWAL

INVESTMENT

RETURN/PERFORMANCE

REFERRAL_COMMISSION

FEE

ADJUSTMENT

Each transaction:

Unique ID

User ID

Type

Amount

Currency

Status

Reference

Description

Created At

Updated At

Use PostgreSQL numeric/decimal values.

Do NOT use JavaScript floating-point arithmetic for financial calculations.

============================================================

29. ADMIN ACTIVITY LOGS

============================================================

Route:

/admin/logs

Track:

Admin Login

Admin Logout

Deposit Approval

Deposit Rejection

Withdrawal Approval

Withdrawal Rejection

Withdrawal Paid

Plan Created

Plan Edited

Plan Disabled

User Suspended

User Activated

Balance Adjustment

Settings Updated

Notification Sent

Store:

Admin ID

Action

Target

Timestamp

Relevant metadata

Before/after values where appropriate

============================================================

30. SETTINGS

============================================================

Route:

/admin/settings

Create professional settings tabs/cards.

---

BRANDING

---

FINORA Logo

App Icon

Dark Logo

Light Logo

Website Name

Browser Title

Footer Name

---

CONTACT

---

Support Name

WhatsApp

Phone

Email

Working Hours

Social links:

Facebook

Instagram

Telegram

YouTube

---

DEPOSIT

---

QR Code

Payment Method

Account Name

Account Number

Instructions

Minimum Deposit

Maximum Deposit

Transaction ID Required

Screenshot Required

---

WITHDRAWAL

---

Easypaisa

JazzCash

UPaisa

Bank Account

Each method:

Enabled / Disabled

---

NOTIFICATIONS

---

Deposit Submitted

Deposit Approved

Deposit Rejected

Investment Activated

Withdrawal Submitted

Withdrawal Approved

Withdrawal Rejected

Withdrawal Paid

Referral Commission

System Announcement

---

REFERRALS

---

Referral System

Commission Type

Commission Percentage

Minimum Qualification

Rules

---

MAINTENANCE

---

Enable/Disable

Maintenance Message

Estimated Return Time

Support Button

Admin must retain access during maintenance.

============================================================

31. WEBSITE CONTENT MANAGEMENT

============================================================

Route:

/admin/content

Admin can manage:

Homepage Hero

About

Plans Intro

How It Works

FAQ

Contact

Footer

Terms

Privacy

Risk Disclosure

Investment Disclosures

Announcements

Changes should reflect on the public website without source-code edits.

============================================================

32. DATABASE

============================================================

Create proper relational tables:

users

profiles

roles

user_roles

investment_plans

investments

wallets

ledger_entries

transactions

deposits

withdrawals

referrals

referral_commissions

notifications

notification_preferences

support_tickets

support_messages

website_settings

deposit_settings

withdrawal_settings

referral_settings

admin_logs

content_pages

announcements

security_events

sessions

Use:

Primary Keys

Foreign Keys

Indexes

Constraints

Timestamps

Index frequently queried fields.

============================================================

33. FINANCIAL SECURITY

============================================================

CRITICAL:

Never trust financial values from frontend requests.

Validate server-side.

Protect:

Balances

Deposits

Withdrawals

Investments

Commissions

Transactions

Plan activation

Use:

Atomic database transactions

Idempotency

Concurrency protection

Server-side validation

Authorization

Decimal financial values

Duplicate prevention

A user must never be able to modify financial state through browser developer tools.

============================================================

34. FILE SECURITY

============================================================

Payment screenshots must be stored privately.

Do not expose screenshots through public URLs.

Use:

Private storage

Access control

Signed URLs or authorized server-side access

File type validation

File size limits

Reject dangerous file types.

============================================================

35. ROLE-BASED ACCESS CONTROL

============================================================

Create roles:

Super Admin

Finance Admin

Operations Admin

Support Admin

Example:

Finance Admin:

Deposits

Withdrawals

Transactions

Support Admin:

Users

Support

Notifications

Super Admin:

Everything

Authorization must be enforced server-side.

============================================================

36. STATUS MACHINES

============================================================

Deposit:

SUBMITTED

PENDING_VERIFICATION

APPROVED

REJECTED

Withdrawal:

PENDING

UNDER_REVIEW

APPROVED

PAID

REJECTED

Investment:

PENDING

ACTIVE

COMPLETED

CANCELLED

Do not allow arbitrary status changes.

Validate allowed transitions on the server.

============================================================

37. RESPONSIVE MOBILE DESIGN

============================================================

Mobile application must feel premium.

Bottom navigation:

Home

Invest

Wallet

Referrals

Profile

Optimize:

Financial cards

Buttons

Tables

Charts

Forms

Modals

Notifications

No horizontal overflow.

Admin should also remain usable on mobile/tablet.

============================================================

38. ANIMATIONS

============================================================

Use subtle premium animations:

Page transitions

Card hover

Button feedback

Chart entrance

Modal transitions

Toast animations

Navigation transitions

Do not overanimate.

Performance must remain excellent.

============================================================

39. LOADING / EMPTY / ERROR STATES

============================================================

Every async operation requires a proper state.

Loading:

Skeleton

Spinner where appropriate

Disabled button

Empty:

No investments

No transactions

No referrals

No notifications

No tickets

Error:

Network error

Unauthorized

Session expired

Validation error

Upload error

Transaction error

Server error

Never expose raw server/database errors.

============================================================

40. SEARCH / FILTER / PAGINATION

============================================================

Admin tables must support:

Search

Filters

Sorting

Pagination

Date ranges

Status

Use server-side pagination for large datasets.

============================================================

41. REAL-TIME UPDATES

============================================================

Where supported, implement realtime/revalidation for:

Notifications

Deposit status

Withdrawal status

Support messages

Admin pending actions

Otherwise use efficient polling/revalidation.

============================================================

42. SECURITY FEATURES

============================================================

Implement:

Secure authentication

Password hashing

Role-based authorization

Rate limiting

Input validation

SQL injection protection

XSS protection

CSRF protection where applicable

Secure headers

Secure cookies

Session expiration

File validation

Private storage

Audit logging

Optional where supported:

2FA

Login alerts

Active session management

Security event tracking

============================================================

43. LEGAL / TRANSPARENCY

============================================================

Include:

Terms & Conditions

Privacy Policy

Investment Terms

Risk Disclosure

Withdrawal Rules

Fees

Referral Rules

Financial return information must be presented accurately.

Do not automatically use:

"Guaranteed profit"

"Risk-free"

"Guaranteed daily income"

unless the actual financial/legal structure supports those statements.

============================================================

44. NO FAKE PRODUCTION DATA

============================================================

Do not create fake:

Users

Deposits

Withdrawals

Investments

Earnings

Transactions

Testimonials

Performance charts

Development seed data may be used only in development/testing.

Production must use real database records.

============================================================

45. PERFORMANCE

============================================================

Optimize:

Initial load

Database queries

Images

API calls

Charts

Bundle size

Caching

Server rendering where appropriate

Use proper database indexes.

Avoid unnecessary requests.

============================================================

46. SEO

============================================================

Public pages:

SEO title

Description

Open Graph

Favicon

Sitemap

Robots configuration

Authenticated pages should not be indexed.

============================================================

47. ACCESSIBILITY

============================================================

Implement:

Keyboard navigation

Focus states

Accessible labels

ARIA where needed

Good contrast

Readable typography

Accessible forms

============================================================

48. USER FLOW

============================================================

NEW USER:

Signup

↓

Login

↓

Dashboard

↓

Explore Plans

↓

Select Plan

↓

Deposit

↓

Payment

↓

Submit Transaction ID + Screenshot

↓

Pending Verification

↓

Admin Review

↓

Approved

↓

Wallet / Investment activation according to configured workflow

↓

Notification

↓

Active Investment

============================================================

49. WITHDRAWAL FLOW

============================================================

Wallet

↓

Withdraw

↓

Select Easypaisa / JazzCash / UPaisa / Bank

↓

Enter Account Details

↓

Enter Amount

↓

Review

↓

Confirm

↓

Pending

↓

Under Review

↓

Approved

↓

Payment Processed

↓

Marked Paid

↓

Notification

============================================================

50. ADMIN OPERATIONS FLOW

============================================================

Admin Login

↓

Admin Dashboard

↓

Pending Actions

↓

Review Deposit / Withdrawal

↓

Verify Details

↓

Approve / Reject

↓

Database Transaction

↓

Ledger

↓

Notification

↓

Audit Log

============================================================

51. IMPORTANT FINANCIAL RULE

============================================================

All financial state changes must be performed server-side.

Never allow:

Frontend → Direct Balance Update

Instead:

User Action

↓

Server Validation

↓

Authorization

↓

Database Transaction

↓

Ledger Entry

↓

Wallet State

↓

Transaction Record

↓

Notification

↓

Audit Log

============================================================

52. ADMIN SETTINGS MUST BE FULLY FUNCTIONAL

============================================================

When admin changes:

Logo

Website Name

Contact Information

Deposit QR

Payment Instructions

Withdrawal Methods

Notification Settings

Referral Configuration

Maintenance Mode

The user-facing application must automatically use the updated settings.

No source-code editing should be necessary.

============================================================

53. PROFESSIONAL UI DETAILS

============================================================

Add:

Premium hover states

Elegant financial charts

Professional status badges

Sticky headers where useful

Smooth transitions

Beautiful confirmation dialogs

Smart tooltips

Responsive tables

Search bars

Filter dropdowns

Date pickers

Pagination

Skeleton loading

Toast notifications

Use icons consistently.

Do not make the UI visually noisy.

============================================================

54. ADMIN DASHBOARD PRIORITY

============================================================

The admin panel is the operational heart of FINORA.

Make it exceptionally polished.

The first screen should immediately show:

Financial Overview

User Overview

Pending Deposits

Pending Withdrawals

Active Investments

Recent Transactions

Recent Users

Support Tickets

System Status

The admin should be able to reach every important operational function within a few clicks.

============================================================

55. QA REQUIREMENTS

============================================================

Before completion, test:

Signup

Login

Logout

Password Reset

Authorization

Admin Authorization

Deposit Submission

Deposit Approval

Deposit Rejection

Withdrawal Submission

Withdrawal Approval

Withdrawal Rejection

Mark Withdrawal Paid

Investment Creation

Investment Activation

Investment Completion

Referral Calculation

Notifications

Support

Settings

Maintenance Mode

File Upload

Mobile UI

Duplicate Requests

Unauthorized API Requests

Security tests:

Normal user → /admin

Normal user → approve deposit

Normal user → change balance

Normal user → modify another user's transaction

Duplicate deposit approval

Duplicate withdrawal submission

Unauthorized API requests

All must fail securely.

============================================================

56. FINAL PRODUCT QUALITY

============================================================

The final application must feel:

HIGH-END

PREMIUM

REALISTIC

INTERNATIONAL

PROFESSIONAL

FAST

SECURE

RESPONSIVE

POLISHED

SCALABLE

It must NOT feel AI-generated.

It must NOT contain:

Dead buttons

Broken routes

Fake statistics

Placeholder text

Unfinished pages

Inconsistent components

Broken mobile layouts

Client-side financial manipulation

Exposed secrets

Public payment screenshots

Unauthorized admin actions

============================================================

57. BUILD STRATEGY

============================================================

Build the application in these phases.

PHASE 1:

Foundation

- Architecture

- Theme

- Database

- Authentication

- Roles

PHASE 2:

Public Website

- Homepage

- Plans

- About

- FAQ

- Contact

- Legal pages

PHASE 3:

User Application

- Dashboard

- Invest

- Wallet

- Referrals

- Profile

- Notifications

- Support

PHASE 4:

Financial Engine

- Deposits

- Withdrawals

- Investments

- Transactions

- Ledger

PHASE 5:

Admin

- Dashboard

- Users

- Deposits

- Withdrawals

- Plans

- Investments

- Referrals

- Transactions

- Notifications

- Support

PHASE 6:

Settings

- Branding

- Contact

- Deposit

- Withdrawal

- Notifications

- Referral

- Maintenance

- Website Content

PHASE 7:

Security

- RBAC

- Validation

- Audit Logs

- Rate Limiting

- Storage Security

- Financial Integrity

PHASE 8:

Polish

- Animations

- Loading states

- Empty states

- Error states

- Responsive design

- Accessibility

- Performance

PHASE 9:

FINAL QA

Test every major workflow end-to-end.

============================================================

58. FINAL INSTRUCTION TO THE AI BUILDER

============================================================

DO NOT ONLY CREATE THE FRONTEND.

Build the actual full-stack application.

Connect:

UI

↓

Backend

↓

Database

↓

Authentication

↓

Authorization

↓

Financial Logic

↓

Ledger

↓

Notifications

↓

Admin

↓

Audit Logs

Every important button must work.

Every form must validate.

Every financial operation must be server-side.

Every admin action must be authorized.

Every important state change must be logged.

Every dashboard metric must come from real database data.

Every user-facing financial status must reflect the actual backend state.

Build FINORA as one cohesive, premium, scalable fintech-style platform.

The final result should look like a serious international financial technology product rather than a simple website.

============================================================

END OF FINORA MASTER PROMPT

============================================================

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a9d7f26c-1961-4e2e-ac1d-a4416122c551).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
