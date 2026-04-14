# Crystal Industries — Manufacturing Portal

A robust, enterprise-grade manufacturing portal for **Crystal Industries**. This system manages the complete lifecycle of radiographic requisition sheets, from creation and vendor assignment to real-time progress tracking, company review (OK/Retake/Repair), and billing.

The portal is a **multitenant system** supporting three distinct user roles: **Super Admin**, **Company Admin**, and **Vendor**.

---

## 🏗 System Architecture

The application is built with a modern decoupled architecture:

- **Frontend**: React 19 + Vite (built with Tailwind CSS v4 and shadcn/ui)
- **Backend**: Node.js + Express (RESTful API)
- **Database**: PostgreSQL (Structured data with JSONB for flexible sheet schemas)
- **Deployment**: Dockerized services for consistent environment scaling

---

## 🛣 User Portals & Features

### 1. Super Admin Portal (`/superadmin`)
*Managed by top-level admins to onboard organizations.*
- **Organizations**: Create and manage distinct organizations (Companies).
- **Control**: Revoke access or update organization details.
- **Global Overview**: View system-wide stats and activity.

### 2. Company Portal (`/company`)
*Used by company staff to manage work and vendors.*
- **Dashboard**: High-level metrics on assignments, pending reviews, and vendor performance.
- **Job Management**: Create and track specific job numbers.
- **Vendor Management**: Create vendor accounts, set credentials, and manage relationships.
- **Requisition Builder**: Create complex Radiographic Requisition Sheets with dynamic sections and rows.
- **Work Assignment**: Assign specific sections of a requisition sheet to different vendors.
- **Review System**: Specialized UI to review vendor submissions (Mark items as **OK**, **Retake**, or **Repair**).
- **Billing**: Generate financial summaries based on completed and accepted work.
- **Completed Works**: Archive and export (PDF/Excel) fully reviewed and completed work orders.

### 3. Vendor Portal (`/vendor`)
*Used by external vendors to execute and submit work.*
- **Orders List**: View all assigned work with real-time status updates from the company.
- **Execution Workflow**: Accept or decline assignments.
- **Data Submission**: Interactive form to fill in technical observations (Spot No, Film Size, Defects) for each assigned section.
- **Reassigned Tasks**: Dedicated view for tasks sent back for Retake or Repair.
- **Film Size Settings**: Personalize quick-select film sizes for faster data entry.

---

## 🔄 The Complete Flow

1.  **Onboarding**: Super Admin creates a **Company** and provides their Unique Organization Code.
2.  **Setup**: Company Admin logs in and creates **Job Numbers** and **Vendors**.
3.  **Sheet Creation**: Company creates a **Radiographic Requisition Sheet** (e.g., Job XYZ, RS #101).
4.  **Assignment**: Company assigns specific items/sections from that sheet to a **Vendor**.
5.  **Acceptance**: Vendor logs in, sees the new assignment, and **Accepts** it.
6.  **Submission**: Vendor fills in the radiographic observations (dimensions, results) and **Submits** it back to the company.
7.  **Review**: Company reviews the submission.
    - If **OK**: The item is marked as complete.
    - If **Repair/Retake**: The item is sent back to the vendor with a specific reason.
8.  **Closure**: Once all items in a sheet are "OK", the work appears in **Completed Works** and is eligible for **Billing**.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite |
| **State/Auth** | React Context API |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL |
| **Containerization** | Docker + Docker Compose |
| **Icons/UI** | Lucide React + Sonner (Toasts) |

---

## 🚀 Getting Started

### Local Development

1.  **Clone and Install**:
    ```bash
    git clone https://github.com/your-repo/cispl-portal.git
    cd cispl-portal
    npm install
    # Also install backend deps if not using Docker
    cd backend && npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file in the `backend/` directory:
    ```env
    PORT=5000
    DATABASE_URL=postgres://user:password@localhost:5432/cispl_db
    JWT_SECRET=your_super_secret_key
    ```

3.  **Run with Docker (Recommended)**:
    ```bash
    docker compose up -d --build
    ```

### Deployment to VPS

1.  Push your changes to your repository.
2.  SSH into your VPS.
3.  Pull latest changes: `git pull origin main`.
4.  Build frontend: `npm run build`.
5.  Restart services: `docker compose up -d --build`.

---

## 📂 Project Structure

```bash
├── backend/
│   ├── routes/          # API Endpoints (auth, assignments, billing, etc.)
│   ├── middleware/      # Auth (JWT) and Portal-specific guards
│   ├── db/              # Database pool configuration
│   └── server.js        # Entry point
├── src/
│   ├── components/      # Shared UI (shadcn) and Layouts
│   ├── lib/             # API client, context (Auth), and hooks
│   └── pages/           # Portal-specific pages
│       ├── superadmin/  # Organization & Org management
│       ├── company/     # Order creation, review, billing
│       └── vendor/      # Order execution & submission
├── public/              # Static assets
└── index.html           # SPA Entry point
```

---

## 🔒 Security

- **JWT Authentication**: All API requests are secured via JSON Web Tokens.
- **Portal Guards**: Backend middleware ensures vendors cannot access company routes and vice versa.
- **Data Isolation**: Each company can only see its own jobs, vendors, and assignments.
