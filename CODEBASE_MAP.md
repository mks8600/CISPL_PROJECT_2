# CISPL Codebase Map — AI Reference Guide

> **What is this?** A manufacturing portal for Crystal Industries managing radiographic requisition sheets. Multi-tenant SaaS with 3 portals: Super Admin, Company, Vendor.

## Tech Stack
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + shadcn/ui + React Router (HashRouter)
- **Backend:** Node.js + Express (ESM) + PostgreSQL + JWT Auth
- **Deploy:** Docker Compose (Nginx + Node API + Postgres)

---

## Directory Tree

```
├── backend/
│   ├── server.js                    # Express entry point, mounts all routes
│   ├── package.json                 # Backend deps: express, pg, bcrypt, jsonwebtoken, cors, helmet
│   ├── db/
│   │   ├── pool.js                  # PostgreSQL connection pool (pg.Pool)
│   │   ├── schema.sql               # All CREATE TABLE statements (9 tables)
│   │   ├── seed.sql                 # Sample data (superadmin, companies, vendors)
│   │   └── generate-seed.js         # Script to generate bcrypt hashes for seed
│   ├── middleware/
│   │   └── auth.js                  # authenticate() — JWT verify; requirePortal() — role guard
│   └── routes/
│       ├── auth.js                  # POST /api/auth/login (3 portals), GET /api/auth/me
│       ├── companies.js             # CRUD /api/companies (superadmin only)
│       ├── vendors.js               # CRUD /api/vendors (superadmin + company)
│       ├── jobs.js                  # CRUD /api/jobs (company, scoped by company_id)
│       ├── sheets.js                # CRUD /api/sheets (company, the requisition forms)
│       ├── assignments.js           # CRUD /api/assignments + review + reassign (company)
│       ├── vendorOrders.js          # /api/vendor-orders: list/accept/decline/save/submit (vendor)
│       ├── filmSizes.js             # CRUD /api/film-sizes (company)
│       ├── vendorFilmSizes.js       # CRUD /api/vendor-film-sizes (vendor)
│       ├── billing.js               # GET /api/billing (aggregates film sizes from completed work)
│       └── dashboard.js             # GET /api/dashboard/{superadmin|company|vendor}
│
├── src/
│   ├── main.jsx                     # React entry: renders <App /> into #root
│   ├── App.jsx                      # All routes defined here (HashRouter)
│   ├── index.css                    # Global styles + Tailwind
│   │
│   ├── layouts/
│   │   ├── CompanyLayout.jsx        # Auth guard (portalType=company) + Header + Sidebar + Outlet
│   │   ├── VendorLayout.jsx         # Auth guard (portalType=vendor) + Header + Sidebar + Outlet
│   │   └── SuperAdminLayout.jsx     # Auth guard (portalType=superadmin) + custom header + Sidebar
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx           # Top bar with logo, user avatar, logout dropdown
│   │   │   └── Sidebar.jsx          # Navigation links (different per portalType), responsive
│   │   ├── orders/
│   │   │   ├── OrderCard.jsx        # Card display for a single order
│   │   │   └── OrderStatusBadge.jsx # Colored badge for order status
│   │   └── ui/                      # shadcn/ui primitives (button, card, dialog, input, select, table, etc.)
│   │
│   ├── pages/
│   │   ├── HomePage.jsx             # Landing page with portal selection buttons
│   │   ├── company/
│   │   │   ├── CompanyLoginPage.jsx        # Login form (email + password + org code)
│   │   │   ├── CompanyDashboardPage.jsx    # Stats cards from dashboardApi.company()
│   │   │   ├── CompanyOrdersPage.jsx       # Lists all sheets, assign to vendor
│   │   │   ├── CreateOrderPage.jsx         # Form to create requisition sheets (sections + rows)
│   │   │   ├── CompanyOrderDetailsPage.jsx # View single sheet detail
│   │   │   ├── CompanyOrderStatusPage.jsx  # Review vendor submissions (OK/Retake/Repair)
│   │   │   ├── CompanyPendingWorkPage.jsx  # Shows assignments needing review
│   │   │   ├── CompanyCompletedWorkPage.jsx# Archive of fully-OK'd work
│   │   │   ├── CompanyBillingPage.jsx      # Film size aggregation from billingApi
│   │   │   └── ManageJobPage.jsx           # CRUD for job numbers + vendors + film sizes
│   │   ├── vendor/
│   │   │   ├── VendorLoginPage.jsx         # Login form (login_id + password)
│   │   │   ├── VendorDashboardPage.jsx     # Stats from dashboardApi.vendor()
│   │   │   ├── VendorOrdersPage.jsx        # List assigned orders, accept/decline
│   │   │   ├── VendorOrderProgressPage.jsx # Fill in observations (spotNo, filmSize, defects)
│   │   │   └── VendorReassignedTasksPage.jsx # Tasks sent back for retake/repair
│   │   └── superadmin/
│   │       ├── SuperAdminLoginPage.jsx     # Login form (email + password)
│   │       ├── SuperAdminDashboardPage.jsx # Global stats
│   │       ├── SuperAdminOrganizationsPage.jsx # CRUD companies + set credentials
│   │       └── SuperAdminVendorsPage.jsx   # CRUD global vendors + set credentials
│   │
│   └── lib/
│       ├── api/
│       │   └── client.js            # API client: api.get/post/put/delete + all domain APIs
│       ├── context/
│       │   └── AuthContext.jsx       # React Context: login(), logout(), user, isAuthenticated
│       ├── hooks/
│       │   └── useOrders.js          # Legacy hook (uses mock-data, NOT used by main pages)
│       ├── mock-data/                # Legacy mock data (orders.js, users.js, vendors.js)
│       ├── types/
│       │   └── index.js             # JSDoc type definitions
│       └── utils.js                 # cn() helper (clsx + tailwind-merge)
│
├── nginx/frontend.conf              # Nginx: SPA fallback + /api/ proxy to backend:3000
├── docker-compose.yml               # 3 services: db (postgres:16), api (node), frontend (nginx)
├── vite.config.ts                   # Vite: @/ alias, dev proxy /api -> localhost:3000
├── index.html                       # SPA shell
└── package.json                     # Frontend deps: react, react-router-dom, radix-ui, shadcn, zod
```

---

## Database Schema (PostgreSQL)

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   super_admins   │     │    companies     │     │     vendors      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (UUID PK)     │     │ id (UUID PK)     │     │ id (UUID PK)     │
│ email            │     │ org_code (UNIQUE)│     │ vendor_no (UNQ)  │
│ password (hash)  │     │ name             │     │ vendor_name      │
│ name             │     │ created_at       │     │ login_id (UNQ)   │
│ created_at       │     │ updated_at       │     │ password (hash)  │
└──────────────────┘     └────────┬─────────┘     │ created_at       │
                                  │                └────────┬─────────┘
                    ┌─────────────┼─────────────┐           │
                    ▼             ▼             ▼           │
          ┌──────────────┐ ┌───────────┐ ┌────────────┐     │
          │    users     │ │   jobs    │ │ film_sizes │     │
          ├──────────────┤ ├───────────┤ ├────────────┤     │
          │ id (UUID PK) │ │ id        │ │ id         │     │
          │ company_id FK│ │ company_id│ │ company_id │     │
          │ email        │ │ job_no    │ │ size_label │     │
          │ password     │ │ description│ └────────────┘     │
          │ name, role   │ └───────────┘                    │
          │ portal_type  │                                  │
          └──────────────┘                                  │
                                                            │
          ┌──────────────────┐                              │
          │     sheets       │                              │
          ├──────────────────┤                              │
          │ id (UUID PK)     │                              │
          │ company_id FK    │                              │
          │ form_data (JSONB)│◄── {date, jobNo, rsNo, ...}  │
          │ sections (JSONB) │◄── [{title, rows:[...]}]     │
          └────────┬─────────┘                              │
                   │                                        │
                   ▼                                        │
          ┌────────────────────────┐                        │
          │     assignments        │◄───────────────────────┘
          ├────────────────────────┤
          │ id (UUID PK)           │
          │ company_id FK          │
          │ vendor_id FK ──────────┘
          │ sheet_id FK
          │ sheet_data (JSONB)     │◄── snapshot of sheet at assignment time
          │ status                 │◄── 'pending' | 'accepted' | 'declined'
          │ submitted (BOOL)       │
          │ section_statuses (JSONB)│◄── ['pending','reassigned',...] per section
          │ review_statuses (JSONB)│◄── ['ok','retake','repair',...] per section
          │ review_descriptions    │
          │ vendor_data (JSONB)    │◄── {[secIdx]:{[rowIdx]:{spotNo,filmSize,defect}}}
          │ reassigned_from (FK)   │◄── self-ref to parent assignment
          └────────────────────────┘

          ┌────────────────────┐
          │ vendor_film_sizes  │
          ├────────────────────┤
          │ id, vendor_id FK   │
          │ size_label         │
          └────────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Auth | Portal | Purpose |
|--------|----------|------|--------|---------|
| POST | `/api/auth/login` | None | all | Login (email, password, portal, orgCode?) |
| GET | `/api/auth/me` | JWT | all | Get current user from token |
| GET | `/api/companies` | JWT | superadmin | List all organizations |
| POST | `/api/companies` | JWT | superadmin | Create organization |
| DELETE | `/api/companies/:id` | JWT | superadmin | Delete organization |
| POST | `/api/companies/:id/credentials` | JWT | superadmin | Set admin user for org |
| GET | `/api/vendors` | JWT | superadmin,company | List all vendors |
| POST | `/api/vendors` | JWT | superadmin,company | Create vendor |
| DELETE | `/api/vendors/:id` | JWT | superadmin,company | Delete vendor |
| POST | `/api/vendors/:id/credentials` | JWT | superadmin,company | Set vendor login |
| GET | `/api/jobs` | JWT | company | List jobs (scoped) |
| POST | `/api/jobs` | JWT | company | Create job number |
| DELETE | `/api/jobs/:id` | JWT | company | Delete job |
| GET | `/api/sheets` | JWT | company | List requisition sheets |
| POST | `/api/sheets` | JWT | company | Create/update sheet |
| DELETE | `/api/sheets/:id` | JWT | company | Delete sheet |
| GET | `/api/assignments` | JWT | company | List assignments |
| POST | `/api/assignments` | JWT | company | Assign sheet to vendor |
| DELETE | `/api/assignments/:id` | JWT | company | Delete assignment |
| PUT | `/api/assignments/:id/review` | JWT | company | Review (OK/Retake/Repair) |
| PUT | `/api/assignments/:id/reassign` | JWT | company | Reassign to new vendor |
| GET | `/api/vendor-orders` | JWT | vendor | List orders for vendor |
| PUT | `/api/vendor-orders/:id/accept` | JWT | vendor | Accept order |
| PUT | `/api/vendor-orders/:id/decline` | JWT | vendor | Decline order |
| PUT | `/api/vendor-orders/:id/data` | JWT | vendor | Save observations |
| PUT | `/api/vendor-orders/:id/submit` | JWT | vendor | Submit completed work |
| GET | `/api/film-sizes` | JWT | company | List company film sizes |
| POST | `/api/film-sizes` | JWT | company | Create film size |
| GET | `/api/vendor-film-sizes` | JWT | vendor | List vendor film sizes |
| POST | `/api/vendor-film-sizes` | JWT | vendor | Create vendor film size |
| GET | `/api/billing?filters` | JWT | company | Billing summary |
| GET | `/api/dashboard/superadmin` | JWT | superadmin | Global stats |
| GET | `/api/dashboard/company` | JWT | company | Company stats |
| GET | `/api/dashboard/vendor` | JWT | vendor | Vendor stats |

---

## Frontend Routes (HashRouter)

| Route | Page Component | Layout | Description |
|-------|---------------|--------|-------------|
| `/` | HomePage | none | Landing with portal selector |
| `/company/login` | CompanyLoginPage | none | Company login |
| `/vendor/login` | VendorLoginPage | none | Vendor login |
| `/superadmin/login` | SuperAdminLoginPage | none | Super admin login |
| `/company/dashboard` | CompanyDashboardPage | CompanyLayout | Company stats |
| `/company/orders` | CompanyOrdersPage | CompanyLayout | List sheets, assign vendors |
| `/company/orders/create` | CreateOrderPage | CompanyLayout | Create requisition sheet |
| `/company/orders/:id` | CompanyOrderDetailsPage | CompanyLayout | Sheet detail view |
| `/company/manage-job` | ManageJobPage | CompanyLayout | Manage jobs, vendors, film sizes |
| `/company/order-status` | CompanyOrderStatusPage | CompanyLayout | Review vendor submissions |
| `/company/pending-work` | CompanyPendingWorkPage | CompanyLayout | Assignments pending review |
| `/company/completed-work` | CompanyCompletedWorkPage | CompanyLayout | Fully completed work |
| `/company/billing` | CompanyBillingPage | CompanyLayout | Billing summary |
| `/vendor/dashboard` | VendorDashboardPage | VendorLayout | Vendor stats |
| `/vendor/orders` | VendorOrdersPage | VendorLayout | Accept/decline orders |
| `/vendor/order-progress` | VendorOrderProgressPage | VendorLayout | Fill observations & submit |
| `/vendor/reassigned-tasks` | VendorReassignedTasksPage | VendorLayout | Retake/repair tasks |
| `/superadmin/dashboard` | SuperAdminDashboardPage | SuperAdminLayout | Global stats |
| `/superadmin/organizations` | SuperAdminOrganizationsPage | SuperAdminLayout | Manage companies |
| `/superadmin/vendors` | SuperAdminVendorsPage | SuperAdminLayout | Manage global vendors |

---

## Business Flow

```
SuperAdmin creates Company (org_code) + sets admin credentials
SuperAdmin creates Vendors globally + sets login credentials
         │
         ▼
Company Admin logs in (email + password + org_code)
         │
         ├─► Creates Job Numbers
         ├─► Creates Film Sizes
         ├─► Creates Requisition Sheet (form_data + sections with rows)
         │        │
         │        ▼
         ├─► Assigns sheet sections to a Vendor → creates "assignment" (status=pending)
         │
         ▼
Vendor logs in (login_id + password)
         │
         ├─► Sees assignment → Accepts (status=accepted) or Declines (status=declined)
         ├─► Fills observations per row: spotNo, filmSize, defect, remarks
         ├─► Submits work (submitted=true)
         │
         ▼
Company reviews each section:
         ├─► OK      → review_status = "ok" → goes to Completed Works + Billing
         ├─► Retake  → review_status = "retake" → vendor sees in Reassigned Tasks
         └─► Repair  → review_status = "repair" → vendor sees in Reassigned Tasks

Company can Reassign failed sections to a different vendor:
         → Creates new child assignment (reassigned_from = parent.id)
         → Parent sections marked as "reassigned"
```

---

## Auth Flow

```
Login Request → POST /api/auth/login {email, password, portal, orgCode?}
    │
    ├─ portal=superadmin → query super_admins table
    ├─ portal=company    → find company by org_code → find user by email+company_id
    └─ portal=vendor     → find vendor by login_id
    │
    ▼
bcrypt.compare(password, hash) → JWT signed with {id, portalType, companyId?, ...}
    │
    ▼
Frontend: setToken(token) → localStorage('cispl_token')
          stores user in localStorage('cispl_user')
    │
    ▼
All API calls: Authorization: Bearer <token>
Backend middleware: authenticate() verifies JWT → req.user
                    requirePortal() checks portalType
```

---

## Key JSONB Data Structures

### Sheet form_data
```json
{ "date": "2026-01-15", "jobNo": "JOB-001", "rsNo": "RS-101", "clientName": "..." }
```

### Sheet sections
```json
[
  {
    "title": "Section A",
    "rows": [
      { "srNo": "1", "drawingNo": "D-001", "description": "Weld joint 1" },
      { "srNo": "2", "drawingNo": "D-002", "description": "Weld joint 2" }
    ]
  }
]
```

### Assignment vendor_data (filled by vendor)
```json
{
  "0": {
    "0": { "spotNo": "3", "filmSize": "10x12", "defect": "None", "remarks": "" },
    "1": { "spotNo": "5", "filmSize": "14x17", "defect": "Crack", "remarks": "Re-examine" }
  }
}
```
> Keys = `[sectionIndex][rowIndex]`

### section_statuses / review_statuses
```json
["pending", "pending"]        // section_statuses (per section)
["ok", "retake"]              // review_statuses (per section, set by company)
```

---

## Important Patterns

1. **Multi-tenancy**: All company data scoped by `company_id` from JWT (`req.user.companyId`)
2. **JSONB flexibility**: Sheets store dynamic form data and sections as JSONB
3. **Assignment snapshot**: `sheet_data` in assignments is a frozen copy of the sheet at assign time
4. **Reassignment chain**: `reassigned_from` FK creates parent→child assignment links
5. **Dual key format**: Backend stores snake_case, vendorOrders.js `normalizeAssignment()` converts to camelCase for frontend
6. **Billing aggregation**: Server-side loops through `vendor_data` JSONB to sum film sizes
7. **API client**: `src/lib/api/client.js` is the single source for all fetch calls
8. **Auth state**: React Context + localStorage for persistence across refreshes
9. **Legacy code**: `useOrders.js` hook and `mock-data/` folder are leftover from pre-API era (not actively used)
10. **HashRouter**: Uses `#/` URLs for S3/static hosting compatibility
