# Crystal Industries — Manufacturing Portal

A web application for **Crystal Industries**, an industrial films manufacturing company. The portal manages radiographic requisition sheets, work order assignment to vendors, and order progress tracking.

Built with **React + Vite + Tailwind CSS v4 + shadcn/ui**.

---

## Features

### Company Portal (`/company`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/company/dashboard` | Overview and quick stats |
| Work Orders | `/company/orders` | Assign saved sheets to vendors |
| Create Order | `/company/orders/create` | Create & save Radiographic Requisition Sheets |
| Manage Job No | `/company/manage-job` | Create and manage job numbers |
| Manage Vendors | `/company/manage-vendors` | Create vendors and set login credentials |
| Order Status | `/company/order-status` | Track section-level progress of accepted orders |

### Vendor Portal (`/vendor`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/vendor/dashboard` | Vendor overview |
| My Orders | `/vendor/orders` | View assigned sheets, accept or decline orders |
| Order Progress | `/vendor/order-progress` | Mark sections as Complete/Pending on accepted orders |

---

## Workflow

1. **Create Jobs** — Go to *Manage Job No* and add job numbers.
2. **Create Vendors** — Go to *Manage Vendors*, add vendors, and set their login credentials.
3. **Create a Sheet** — Go to *Create Order*, fill the Radiographic Requisition Sheet, add detail sections, and click *Save Sheet*.
4. **Assign to Vendor** — Go to *Work Orders*, select a saved sheet and a vendor, then click *Assign*.
5. **Vendor Responds** — Vendor logs in, views the sheet on *My Orders*, and clicks *Accept* or *Decline*.
6. **Track Progress** — Vendor marks sections as Complete/Pending on *Order Progress*. Company monitors via *Order Status*.

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
│   │   ├── CompanyDashboardPage.jsx
│   │   ├── CompanyOrdersPage.jsx
│   │   ├── CompanyOrderStatusPage.jsx
│   │   ├── CreateOrderPage.jsx
│   │   ├── ManageJobPage.jsx
│   │   └── ManageVendorsPage.jsx
│   └── vendor/
│       ├── VendorDashboardPage.jsx
│       ├── VendorOrdersPage.jsx
│       └── VendorOrderProgressPage.jsx
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
| `crystal_assigned_sheets` | Sheets assigned to vendors with status tracking |
