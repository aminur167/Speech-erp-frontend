# Speech Therapy Lab — Frontend

A modern frontend for **Speech Therapy Lab**, a multi-branch clinic management and payment system. The frontend provides role-based dashboards and user interfaces for patient management, service enrollment, payment collection, due payments, receipts, daily closing, and admin reporting.

> **Frontend scope:** This README covers only the frontend application. Backend, database, API implementation, deployment infrastructure, and server-side authentication are intentionally excluded.

> **Backend note:** No backend exists yet. A Django + Django REST Framework (DRF) backend will be added later. The frontend's API layer, pagination, error handling, and auth strategy are deliberately designed around DRF conventions now so the real backend can be plugged in later with minimal rework — see [API Integration Layer](#-api-integration-layer-designed-for-a-future-django-backend) and [Authentication & Token Strategy](#-authentication--token-strategy-django-ready).

---

## 📚 Table of Contents

- [Features](#-features)
- [Branch Manager Navigation](#-branch-manager-navigation)
- [Core Frontend Architecture](#️-core-frontend-architecture)
- [Suggested Project Structure](#-suggested-project-structure)
- [Technology Stack](#️-technology-stack)
- [API Integration Layer](#-api-integration-layer-designed-for-a-future-django-backend)
- [UI / UX Principles](#-ui--ux-principles)
- [Color Theme](#-color-theme-design-tokens)
- [Frontend Access Control](#-frontend-access-control)
- [Authentication & Token Strategy](#-authentication--token-strategy-django-ready)
- [TanStack Query Usage](#-tanstack-query-usage)
- [Reusable Components](#-reusable-components)
- [Forms & Validation Convention](#-forms--validation-convention)
- [Important UI States](#-important-ui-states)
- [Global Error Handling](#-global-error-handling)
- [Payment Status UI](#-payment-status-ui)
- [Responsive Design](#-responsive-design)
- [Accessibility & Browser Support](#-accessibility--browser-support)
- [Development Phases](#-development-phases)
- [Frontend Testing](#-frontend-testing)
- [MVP Frontend](#-mvp-frontend)
- [Environment Variables](#-environment-variables)
- [Getting Started](#️-getting-started)
- [Available Scripts](#-available-scripts)
- [Contributing / Code Style](#-contributing--code-style)
- [License](#-license)
- [Frontend Goal](#-frontend-goal)

---

## ✨ Features

### Authentication & Role-Based UI
- Login interface
- Role-based navigation
- Admin / Owner dashboard
- Branch Manager dashboard
- Protected frontend routes
- Permission-aware UI

### Patient Management
- Patient registration
- Automatic unique Patient ID display
- Patient search by ID, name, or phone
- Patient profile
- Active services
- Payment history

Example Patient ID:

```text
PT-2026-00125
```

### Service Management

The frontend supports four service/payment categories:

- **Daily Services**
- **Monthly Services**
- **Installment Services**
- **Online / Booking Services**

Service cards can display:
- Service name
- Service code
- Fee
- Payment type
- Online/offline status
- Service description

### Daily Services
Frontend flow:

```text
Daily Services
      ↓
Select Service
      ↓
Search Patient
      ↓
Confirm Patient
      ↓
Payment
      ↓
Transaction
      ↓
Receipt
```

Example services:
- Consultation
- Outdoor Session
- Materials / Equipment
- Certificate Fee
- Other Fees

### Monthly Services

Frontend flow:

```text
Monthly Services
      ↓
Select Service
      ↓
Search Patient
      ↓
Create Enrollment
      ↓
View Current Bill
      ↓
Payment
      ↓
Receipt
```

Example UI:

```text
Individual Therapy
Monthly Fee: ৳5,000

August 2026   → PAID
September     → DUE
October       → UPCOMING
```

### Installment Services

Frontend flow:

```text
Installment Services
      ↓
Select Service
      ↓
Search Patient
      ↓
Select Installment Plan
      ↓
View Schedule
      ↓
Collect Payment
      ↓
Receipt
```

Example:

```text
Assessment
Total: ৳6,000

1st Installment   ৳2,000   PAID
2nd Installment   ৳2,000   DUE
3rd Installment   ৳2,000   UPCOMING
```

### Online Services / Booking

Frontend flow:

```text
Online Services
      ↓
Select Service
      ↓
Search Patient
      ↓
Select Date & Time
      ↓
Create Booking
      ↓
Advance Payment
      ↓
Booking Confirmation
      ↓
Receipt
```

Possible services:
- Online Session
- Online Consultation
- Online Training
- Online Screening
- Online Assessment

### Due Payment Collection

A dedicated interface for existing outstanding payments.

Includes:
- Due installments
- Due monthly bills
- Patient search
- Payment type filter
- Due date filter
- Payment status
- Collect Payment action

Example:

```text
Total Due       ৳45,500
Installment     ৳18,500
Monthly         ৳27,000
```

### Payment UI

A reusable payment interface can be used for:

- Daily payments
- Monthly enrollment payments
- Installment payments
- Due installment payments
- Due monthly payments
- Advance / booking payments

Supported payment method options in the UI:

- Cash
- bKash
- Nagad
- Rocket
- Bank Transfer
- Online Payment
- Card

### Receipt

After a successful payment, the frontend can display a receipt containing:

- Payment ID
- Transaction ID
- Receipt Number
- Payment Method
- Amount
- Collected By
- Branch
- Timestamp

> The receipt view should support a **Print** action (`window.print()` with a print-only stylesheet, or a PDF export) since branch staff typically hand a printed copy to the patient.

### Daily Closing

Branch managers can review the day's collection and submit a closing report.

```text
System Collection
        ↓
Review Collection
        ↓
Enter Actual Collection
        ↓
Compare Difference
        ↓
Submit Closing
```

Example:

```text
System Total:    ৳15,500
Actual Total:    ৳15,500
Difference:      ৳0
Status:          MATCHED
```

### Expense Management

Every business has running costs, so the frontend includes a voucher-based expense workflow for tracking and approving branch spending — not just patient revenue.

**Expense voucher fields:**
- Category — Rent, Utilities, Salaries, Supplies, Equipment, Maintenance, Marketing, Other
- Amount (BDT)
- Description
- Paid To (vendor / payee name)
- Date
- Payment Method — Cash, bKash, Nagad, Rocket, Bank Transfer, Card, Online Payment
- Status — Pending, Approved, Rejected
- Remarks (optional notes)
- Recurring flag — for repeating costs like monthly rent or salaries

**Branch Manager — Expense screen:**
- Page header: breadcrumb (`Home > Manager > Expense`) + title + short description + a primary **+ Add Expense** action
- Summary stat cards:
  - Total Expenses — all recorded branch spending, with voucher count and a **Quick Add** shortcut
  - Today's Expenses — live daily operational cost total
  - Monthly Expenses — running current-month aggregate
  - Pending Approvals — vouchers awaiting review
- Search by voucher ID, description, or payee
- Filters: Category, Status, Payment Method, Date range, plus a **Clear** action
- Table toolbar: Refresh, Export, Columns (show/hide columns)
- **Add Expense** opens a form/modal covering all voucher fields above

**Admin / Owner — Expense oversight:**
- Same voucher list, scoped across every branch instead of one
- Approve or reject vouchers pending review
- Branch-wise and category-wise expense breakdown for reporting

**Approval workflow:**

```text
Manager Records Voucher
        ↓
Amount below auto-approval threshold? ──Yes──> Approved
        │No
        ↓
Pending Admin Approval
        ↓
Admin Approves / Rejects
```

> Example threshold: vouchers under ৳5,000 are auto-approved; larger ones require Admin sign-off. The exact threshold is a configurable business rule, not a hardcoded UI value.

Example voucher:

```text
EXP-2026-00042   Equipment   ৳12,000   Paid To: Dhaka Medical Supplies   Status: PENDING
```

### Admin Dashboard

The Admin / Owner frontend can display:

- Total branches
- Total patients
- Today's collection
- Monthly collection
- Total due
- Total expenses (this month)
- Branch comparison
- Revenue reports
- Service reports
- Payment-type reports
- Outstanding dues
- Patient registration
- Service enrollment
- Manager collection
- Daily closing mismatches
- Refund / void reports
- Pending expense approvals

---

## 🧭 Branch Manager Navigation

```text
Dashboard

Patient Register

Enroll Service
    ├── Daily Services
    ├── Monthly Services
    ├── Installment Services
    └── Online Services

Due Payment Collection

Expenses

Daily Closing

Settings

Logout
```

The **Enroll Service** menu should be expandable/collapsible.

---

## 🏗️ Core Frontend Architecture

The UI is organized around the following business flow:

```text
SERVICE
   ↓
ENROLLMENT / VISIT / BOOKING
   ↓
BILLING
   ↓
PAYMENT
   ↓
TRANSACTION
   ↓
RECEIPT
```

The frontend should keep these concepts separate in the UI because a **service**, a patient's **enrollment**, and a **payment** represent different parts of the workflow.

---

## 📁 Suggested Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── branches/
│   │   ├── patients/
│   │   ├── services/
│   │   └── reports/
│   └── manager/
│       ├── dashboard/
│       ├── patients/
│       ├── services/
│       │   ├── daily/
│       │   ├── monthly/
│       │   ├── installment/
│       │   └── online/
│       ├── due-payments/
│       ├── receipts/
│       └── daily-closing/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── patients/
│   ├── services/
│   ├── payments/
│   ├── receipts/
│   └── dashboard/
│
├── hooks/
│
├── lib/
│   ├── api/                  # All HTTP calls live here — never call fetch/axios from components
│   │   ├── client.ts         # Base axios instance + interceptors (auth header, refresh, error normalization)
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── services.ts
│   │   ├── payments.ts
│   │   ├── receipts.ts
│   │   └── dailyClosing.ts   # One module per future Django app — keeps the mapping 1:1
│   └── query-keys.ts         # Centralized TanStack Query key factory
│
├── store/                    # Client-only global state (Zustand): auth user, active branch, UI state
│
├── providers/
│
├── types/                    # Shared TS types — mirror the shape future Django serializers will return
│
└── utils/
```

---

## 🛠️ Technology Stack

### Frontend

- **TypeScript** — Type-safe application development
- **Next.js** — React framework and application routing
- **Tailwind CSS** — Utility-first styling
- **TanStack Query** — Server-state fetching, caching, synchronization, and mutation handling

### Supporting Frontend Tools

Recommended frontend tooling:

- ESLint
- Prettier
- React Hook Form
- Zod
- Lucide React / another icon library

> The core required stack for this frontend is **TypeScript + Next.js + Tailwind CSS + TanStack Query**.

---

## 🔌 API Integration Layer (Designed for a Future Django Backend)

There is no backend yet — this frontend will be built first, against mock/local data, and a **Django + Django REST Framework (DRF)** backend will be connected afterward. To make that connection painless, follow these conventions from day one:

- **Single API client** — all HTTP calls go through `lib/api/client.ts` (an axios instance). Never call `fetch`/`axios` directly inside components or hooks.
- **One module per Django app** — `lib/api/patients.ts`, `services.ts`, `payments.ts`, `receipts.ts`, `dailyClosing.ts`, `auth.ts`. Each maps 1:1 to a future Django app, so adding the real backend later means implementing the inside of these files, not changing anything that calls them.
- **Mock data now, real API later** — implement each `lib/api/*.ts` function against static JSON / an in-memory mock (or MSW) today, matching the exact function signature it will have once Django is live. Swapping the implementation later shouldn't require touching components.
- **Assume DRF's default paginated list shape** for any list endpoint, and build `Pagination`/`DataTable`/list hooks around it now:
  ```json
  {
    "count": 128,
    "next": "http://localhost:8000/api/patients/?page=3",
    "previous": "http://localhost:8000/api/patients/?page=1",
    "results": [ ]
  }
  ```
- **Assume DRF's default validation error shape** for form submissions, and design error handling to map it onto form fields:
  ```json
  { "phone": ["This field is required."] }
  ```
- **Query params follow DRF conventions**: `?search=`, `?ordering=`, `?page=`, `?page_size=` — for patient search, transaction filters, due-payment filters, etc.
- All backend URLs are read from environment variables (see [Environment Variables](#-environment-variables)) — never hardcoded — so pointing the app at the real Django server later is a config change, not a code change.

---

## 🎨 UI / UX Principles

The frontend should be:

- Clean and modern
- Responsive
- Easy to use for clinic staff
- Consistent across all pages
- Desktop-first while remaining mobile-friendly
- Accessible
- Component-based
- Fast and easy to navigate

### Design Priorities

1. Clear navigation
2. Simple forms
3. Easy patient search
4. Visible payment status
5. Clear due amounts
6. Strong confirmation states
7. Consistent tables and cards
8. Useful loading, empty, and error states

---

## 🌈 Color Theme (Design Tokens)

One consistent color system, defined once (Tailwind theme tokens / CSS variables) and referenced everywhere — never a raw hex code hardcoded inside a component.

**Rationale:** this is a clinical/healthcare product (speech therapy), so the palette leans calm, trustworthy, and clinical rather than generic corporate blue — while staying warm enough for a practice that treats children.

### Primary — Clinical Teal
- `primary`: `#0F766E` (teal-700) — primary buttons, active nav, key actions, links
- `primary-hover`: `#0D9488` (teal-600)
- `primary-light`: `#CCFBF1` (teal-100) — subtle surfaces, badges, hover backgrounds
- `primary-dark`: `#134E4A` (teal-900) — headers, high-emphasis text on light surfaces

### Accent — Warm Coral
Used sparingly, only for the single highest-priority action on a screen (e.g. **Collect Payment**, **Confirm Booking**), so it doesn't compete with primary teal.
- `accent`: `#F97316` (orange-500)
- `accent-hover`: `#EA580C` (orange-600)

### Neutrals
- `background`: `#F8FAFC` (slate-50)
- `surface` (cards/modals): `#FFFFFF`
- `border`: `#E2E8F0` (slate-200)
- `text-primary`: `#0F172A` (slate-900)
- `text-secondary`: `#64748B` (slate-500)

### Semantic (feedback/system messages)
- `success`: `#16A34A` (green-600)
- `warning`: `#D97706` (amber-600)
- `danger`: `#DC2626` (red-600)
- `info`: `#2563EB` (blue-600)

### Payment / Financial Status Colors
Maps onto the badges defined in [Payment Status UI](#-payment-status-ui):

| Status    | Token                | Color     |
|-----------|----------------------|-----------|
| PAID      | `success`            | `#16A34A` |
| DUE       | `warning`             | `#D97706` |
| UPCOMING  | `text-secondary`      | `#64748B` |
| PARTIAL   | `warning` (muted)     | `#F59E0B` |
| CANCELLED | neutral / `slate-400` | `#94A3B8` |
| REFUNDED  | `purple-600`          | `#7C3AED` |
| VOID      | `danger`              | `#DC2626` |

### Implementation
- Define these under `theme.extend.colors` in `tailwind.config.ts` (or as CSS variables in `globals.css`), and use the semantic names in components (`bg-primary`, `text-danger`) — not raw hex values.
- Light-mode-first, matching desktop clinic usage; dark mode is not a current requirement.

---

## 🔐 Frontend Access Control

The UI should respect the two main roles.

### Admin / Owner

Can access:

```text
All Branches
All Patients
All Services
All Transactions
Reports
Daily Closing Review
Expense Approvals
System Settings
```

### Branch Manager

Can access only their operational screens:

```text
Patients
Services
Payments
Due Payments
Expenses
Receipts
Daily Closing
Settings
```

The frontend should hide or disable actions that are not available to the current role.

> Frontend route protection is a UX/security layer; actual authorization must be enforced by the backend.

---

## 🔑 Authentication & Token Strategy (Django-Ready)

Django backends typically issue JWT access/refresh tokens (e.g. via `djangorestframework-simplejwt`). Build the frontend auth flow around that now, even against mock data:

- **Access token** kept in memory (global store), attached as `Authorization: Bearer <token>` by the API client's request interceptor.
- **Refresh token** — prefer an httpOnly cookie set by the backend later (safer than localStorage); the API client should silently refresh and retry once on a `401`.
- `lib/api/auth.ts` exposes `login`, `logout`, `refresh`, and `getCurrentUser` — mocked today, pointed at real Django endpoints later, with the same function signatures.
- Logged-in user + role live in the global client store (`store/`), not in TanStack Query — it's session state, not server-cached data.
- Logout clears the store and redirects to `/login`.
- **CORS** is a backend concern (`django-cors-headers` will need the Next.js dev origin allow-listed) — note it as a future backend TODO, not something to solve in this repo.

---

## 🔄 TanStack Query Usage

TanStack Query should be used for server-state management.

Typical frontend operations:

```text
Query
 ├── Fetch patients
 ├── Fetch patient profile
 ├── Fetch services
 ├── Fetch due payments
 ├── Fetch transactions
 └── Fetch dashboard data

Mutation
 ├── Create patient
 ├── Create enrollment
 ├── Create payment
 ├── Create booking
 └── Submit daily closing
```

Benefits:

- Request caching
- Automatic refetching
- Loading/error states
- Mutation handling
- Query invalidation
- Better UI responsiveness

---

## 🧩 Reusable Components

Important reusable components should include:

```text
Button
Input
Select
Modal
Dialog
Dropdown
Breadcrumb
Table
DataTable
Pagination
Card
Badge
Tabs
DatePicker
SearchInput
PatientSearch
BranchSwitcher
ServiceCard
PaymentForm
PaymentMethodSelector
PaymentSummary
Receipt
PrintReceiptButton
ExpenseForm
ExpenseStatusBadge
Toast / Notification
FileUpload
StatusBadge
ConfirmDialog
LoadingState
Skeleton
EmptyState
ErrorState
```

Reusable components should be shared instead of rebuilding similar UI for each page.

---

## ✅ Forms & Validation Convention

- Every form uses **React Hook Form** for form state and **Zod** for schema validation.
- Field names in each Zod schema should match the payload keys the future Django serializer will expect — this avoids a remapping layer when the real backend arrives.
- On submit, map server-side field errors (DRF's `{ field: ["message"] }` shape) back onto the corresponding React Hook Form field using `setError`, so backend validation errors surface next to the right input.

---

## 📊 Important UI States

Every data-driven page should handle:

### Loading

```text
Loading...
Skeleton...
```

### Empty

```text
No patients found.
No due payments found.
No transactions found.
```

### Error

```text
Something went wrong.
Please try again.
```

### Success

```text
Payment completed successfully.
Patient registered successfully.
Booking created successfully.
```

---

## 🧯 Global Error Handling

- Wrap the app (or major route groups) in a React Error Boundary so a render-time crash shows a friendly fallback instead of a blank page.
- Normalize every API error inside `lib/api/client.ts` into one shape (e.g. `{ message, fieldErrors? }`) before it reaches components — UI code should never branch on axios vs. DRF error formats directly.
- Drive the `ErrorState` component from TanStack Query's `error`/`isError` state; avoid raw `alert()` for user-facing errors.

---

## 💰 Payment Status UI

Use clear visual status indicators:

```text
PAID
DUE
UPCOMING
PARTIAL
CANCELLED
REFUNDED
VOID
```

Financial values should always be displayed clearly, for example:

```text
Total: ৳18,500
Paid:  ৳10,000
Due:   ৳8,500
```

---

## 📱 Responsive Design

The application should support:

- Desktop
- Laptop
- Tablet
- Mobile

The primary workflow is expected to be used on desktop/laptop screens inside clinic branches, but important pages should remain usable on smaller screens.

---

## ♿ Accessibility & Browser Support

- Target **WCAG 2.1 AA** where practical: sufficient color contrast, keyboard-navigable forms/menus/modals, visible focus states, semantic HTML, meaningful `alt` text on icons/images.
- Officially support the latest two versions of Chrome, Edge, and Firefox — clinic desktops are the primary target, older browsers are not a priority.

---

## 🚀 Development Phases

### Phase 1 — App Foundation
- Next.js setup
- TypeScript setup
- Tailwind CSS setup
- TanStack Query setup
- Global layout
- Theme/design system
- Reusable UI components

### Phase 2 — Authentication UI
- Login page
- Role-based navigation
- Protected route UI
- User profile

### Phase 3 — Patient UI
- Patient registration
- Patient search
- Patient list
- Patient profile
- Patient history

### Phase 4 — Service UI
- Service categories
- Service cards
- Service details
- Payment model display

### Phase 5 — Enrollment UI
- Daily services
- Monthly services
- Installment services
- Online bookings

### Phase 6 — Payment UI
- Payment form
- Payment methods
- Payment summary
- Transaction history
- Receipt

### Phase 7 — Financial UI
- Due payment collection
- Expense management (record, search/filter, approve/reject)
- Daily closing
- Collection summary
- Mismatch indicators

### Phase 8 — Admin UI
- Admin dashboard
- Branch overview
- Reports
- Revenue analytics
- Due reports

### Phase 9 — Polish
- Responsive optimization
- Accessibility
- Error handling
- Loading states
- Empty states
- Performance optimization
- UI testing

---

## 🧪 Frontend Testing

Recommended testing areas:

- Component rendering
- Form validation
- Patient search
- Service selection
- Payment form behavior
- Booking flow
- Role-based navigation
- Route protection
- Loading states
- Error states
- Responsive layouts

Recommended tools can include:

- Vitest / Jest
- React Testing Library
- Playwright

---

## 📌 MVP Frontend

### Must Have

- Login UI
- Admin / Manager dashboards
- Role-based navigation
- Patient registration
- Patient search
- Patient profile
- Service management UI
- Daily services
- Monthly services
- Installment services
- Online services
- Payment collection UI
- Due payment collection
- Expense management (voucher entry, approvals)
- Transaction history
- Receipt
- Daily closing
- Admin financial dashboard

### Later

- SMS notification UI
- WhatsApp notification UI
- Online payment gateway UI
- QR receipt verification
- Appointment calendar
- Therapist management
- Attendance
- Payroll
- Inventory
- Advanced analytics
- Mobile app

---

## 🌐 Environment Variables

Create a `.env.local` (not committed) based on a checked-in `.env.example`:

```bash
# Base URL of the backend API — will point to the Django/DRF server once it exists
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Optional: separate base if auth endpoints live on a different path/host
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:8000/api/auth
```

All backend URLs stay behind `NEXT_PUBLIC_*` variables so switching from mock data to the real Django backend later is a config change, not a code change.

---

## ⚙️ Getting Started

### 1. Clone the project

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

### 4. Build for production

```bash
npm run build
```

### 5. Start production build

```bash
npm run start
```

---

## 📜 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## 🎯 Frontend Goal

The goal of this frontend is to provide a **clean, fast, scalable, and easy-to-use clinic management interface** where branch staff can manage patients, services, payments, bookings, and daily operations while Admin / Owner users can monitor the overall organization.

The frontend should keep the workflows simple:

```text
Patient
   ↓
Service
   ↓
Enrollment / Visit / Booking
   ↓
Payment
   ↓
Receipt
```

and provide a consistent experience across every branch.

---

## 🧑‍💻 Contributing / Code Style

- Run `npm run lint` before committing.
- Function components + hooks only — no class components.
- Component files use PascalCase (`PatientSearch.tsx`); hooks use camelCase with a `use` prefix (`usePatients.ts`).
- Keep components small; colocate a component's types/schema with it unless they're shared across pages.

---

## 📄 License

License to be decided.
