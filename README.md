# Crystal Industries — Manufacturing Portal

A web application for **Crystal Industries**, an industrial films manufacturing company. The portal manages radiographic requisition sheets, work order assignment to vendors, and order progress tracking with company review workflow.

Built with **React + Vite + Tailwind CSS v4 + shadcn/ui**.

---

## Features

### Company Portal (`/company`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/company/dashboard` | Overview, quick stats, and **Manage Film Size** tool |
| Work Orders | `/company/orders` | Assign saved sheets to vendors |
| Create Order | `/company/orders/create` | Create & save Radiographic Requisition Sheets with film size dropdown |
| Manage Job No | `/company/manage-job` | Create and manage job numbers |
| Manage Vendors | `/company/manage-vendors` | Create vendors and set login credentials |
| Order Status | `/company/order-status` | Review submitted sections — mark as **OK**, **Retake**, or **Repair** with descriptions |
| Pending Work | `/company/pending-work` | View incomplete, retake, and repair sections — **reassign to vendors** |

### Vendor Portal (`/vendor`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/vendor/dashboard` | Vendor overview |
| My Orders | `/vendor/orders` | View assigned sheets with company review badges (OK/Retake/Repair) and descriptions |
| Order Progress | `/vendor/order-progress` | Mark sections as Complete/Pending, view company review status, and **submit to company** |

---

## Workflow

1. **Create Jobs** — Go to *Manage Job No* and add job numbers.
2. **Manage Film Sizes** — Click *Manage Film Size* on the Dashboard to add film sizes (used in the requisition sheet dropdown).
3. **Create Vendors** — Go to *Manage Vendors*, add vendors, and set their login credentials.
4. **Create a Sheet** — Go to *Create Order*, fill the Radiographic Requisition Sheet (select film sizes from dropdown), add detail sections, and click *Save Sheet*.
5. **Assign to Vendor** — Go to *Work Orders*, select a saved sheet and a vendor, then click *Assign*.
6. **Vendor Responds** — Vendor logs in, views the sheet on *My Orders*, and clicks *Accept* or *Decline*.
7. **Track Progress** — Vendor marks sections as Complete/Pending on *Order Progress*, then clicks **Submit to Company**.
8. **Company Review** — Company reviews each section on *Order Status*, marking as **OK**, **Retake**, or **Repair** (with description).
9. **Vendor Sees Review** — Retake/Repair badges and reasons appear on vendor's *My Orders* and *Order Progress* pages.
10. **Reassign Pending Work** — Company views incomplete and retake/repair sections on *Pending Work* and reassigns to a vendor.

---

## Tech Stack

- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Data Persistence**: `localStorage` (no backend)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

---

## Default Login

### Company Portal

- **Email**: `admin@crystalindustries.com`
- **Password**: `demo123`

### Vendor Portal

Use credentials set via the *Manage Vendors* page in the Company Portal.

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Sidebar
│   └── ui/              # shadcn/ui components
├── layouts/
│   ├── CompanyLayout.jsx
│   └── VendorLayout.jsx
├── lib/
│   ├── context/         # AuthContext
│   ├── mock-data/       # Users, orders, vendors
│   └── utils.js         # cn() utility
├── pages/
│   ├── company/
│   │   ├── CompanyDashboardPage.jsx   # Dashboard + Manage Film Size
│   │   ├── CompanyOrdersPage.jsx      # Assign sheets to vendors
│   │   ├── CompanyOrderStatusPage.jsx # Review sections (OK/Retake/Repair)
│   │   ├── CompanyPendingWorkPage.jsx # Pending/Retake/Repair → reassign
│   │   ├── CreateOrderPage.jsx        # Create requisition sheets
│   │   ├── ManageJobPage.jsx          # Manage job numbers
│   │   └── ManageVendorsPage.jsx      # Manage vendor accounts
│   └── vendor/
│       ├── VendorDashboardPage.jsx
│       ├── VendorOrdersPage.jsx       # View orders + review badges
│       └── VendorOrderProgressPage.jsx # Progress tracking + submit
└── App.jsx
```

---

## localStorage Keys

| Key | Description |
|-----|-------------|
| `crystal_auth` | Current authenticated user session |
| `crystal_jobs` | Job numbers created in Manage Job No |
| `crystal_vendors` | Vendors created in Manage Vendors |
| `crystal_sheets` | Saved Radiographic Requisition Sheets |
| `crystal_assigned_sheets` | Sheets assigned to vendors with status, review, and submission tracking |
| `crystal_film_sizes` | Film sizes managed from Dashboard |
