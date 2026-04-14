-- CISPL Multi-Tenant SaaS — Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES (tenants / organizations)
-- ============================================
CREATE TABLE companies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_code    VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS (company admins, managers)
-- ============================================
CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
    email        VARCHAR(255) NOT NULL,
    password     VARCHAR(255) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    role         VARCHAR(50) DEFAULT 'admin',
    portal_type  VARCHAR(20) DEFAULT 'company',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, company_id)
);

CREATE INDEX idx_users_company ON users(company_id);

-- ============================================
-- 3. VENDORS (global marketplace)
-- ============================================
CREATE TABLE vendors (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_no    VARCHAR(50) UNIQUE NOT NULL,
    vendor_name  VARCHAR(255) NOT NULL,
    login_id     VARCHAR(255) UNIQUE,
    password     VARCHAR(255),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SUPER ADMINS
-- ============================================
CREATE TABLE super_admins (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. JOBS (per company)
-- ============================================
CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
    job_no      VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, job_no)
);

CREATE INDEX idx_jobs_company ON jobs(company_id);

-- ============================================
-- 6. FILM SIZES (per company)
-- ============================================
CREATE TABLE film_sizes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
    size_label  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, size_label)
);

CREATE INDEX idx_film_sizes_company ON film_sizes(company_id);

-- ============================================
-- 7. SHEETS (work order sheets created by company)
-- ============================================
CREATE TABLE sheets (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    form_data    JSONB NOT NULL,
    sections     JSONB NOT NULL,
    saved_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sheets_company ON sheets(company_id);
CREATE INDEX idx_sheets_date ON sheets((form_data->>'date'));
CREATE INDEX idx_sheets_job_no ON sheets((form_data->>'jobNo'));

-- ============================================
-- 8. ASSIGNMENTS (sheet assigned to vendor)
-- ============================================
CREATE TABLE assignments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name     VARCHAR(255),
    vendor_id        UUID REFERENCES vendors(id) ON DELETE SET NULL,
    vendor_name      VARCHAR(255),
    vendor_no        VARCHAR(50),
    sheet_id         UUID REFERENCES sheets(id) ON DELETE SET NULL,
    sheet_data       JSONB NOT NULL,
    status           VARCHAR(50) DEFAULT 'pending',
    submitted        BOOLEAN DEFAULT FALSE,
    submitted_at     TIMESTAMPTZ,
    section_statuses JSONB,
    review_statuses  JSONB,
    vendor_data      JSONB,
    reassigned_from  UUID REFERENCES assignments(id) ON DELETE SET NULL,
    assigned_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_company ON assignments(company_id);
CREATE INDEX idx_assignments_vendor ON assignments(vendor_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_submitted ON assignments(submitted);
CREATE INDEX idx_assignments_reassigned ON assignments(reassigned_from);

-- ============================================
-- 9. VENDOR FILM SIZES (per vendor)
-- ============================================
CREATE TABLE vendor_film_sizes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id   UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    size_label  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, size_label)
);

CREATE INDEX idx_vendor_film_sizes_vendor ON vendor_film_sizes(vendor_id);
