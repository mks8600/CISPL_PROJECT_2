-- CISPL Multi-Tenant SaaS — Seed Data
-- Run after schema.sql

-- ============================================
-- Super Admin (password: 'admin')
-- bcrypt hash generated with 10 rounds
-- ============================================
INSERT INTO super_admins (email, password, name) VALUES
('superadmin', '$2b$10$8K1p/a0dR1xqM8lGhBqKCuBk5fA3fHnVxLv5YGpOqU5K3bZz1LYXK', 'Master Administrator');

-- ============================================
-- Sample Companies
-- ============================================
INSERT INTO companies (id, org_code, name) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234560001', 'CISPL', 'Crystal Industries & Solutions Pvt. Ltd.'),
('a1b2c3d4-e5f6-7890-abcd-ef1234560002', 'ACME', 'Acme Corp');

-- ============================================
-- Company Users (password: 'admin')
-- ============================================
INSERT INTO users (company_id, email, password, name, role) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234560001', 'admin', '$2b$10$8K1p/a0dR1xqM8lGhBqKCuBk5fA3fHnVxLv5YGpOqU5K3bZz1LYXK', 'Admin User', 'admin'),
('a1b2c3d4-e5f6-7890-abcd-ef1234560002', 'admin', '$2b$10$8K1p/a0dR1xqM8lGhBqKCuBk5fA3fHnVxLv5YGpOqU5K3bZz1LYXK', 'Acme Admin', 'admin');

-- ============================================
-- Sample Vendors (password: 'vendor123')
-- ============================================
INSERT INTO vendors (vendor_no, vendor_name, login_id, password) VALUES
('V001', 'FilmWorks Ltd', 'vendor@filmworks.com', '$2b$10$dJKl3nP5QrS7tU9vW1xY3.aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3u'),
('V002', 'Industrial Films Co', 'vendor@industrialfilms.com', '$2b$10$dJKl3nP5QrS7tU9vW1xY3.aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3u'),
('V003', 'Quality Films Inc', 'vendor@qualityfilms.com', '$2b$10$dJKl3nP5QrS7tU9vW1xY3.aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3u');

-- NOTE: The bcrypt hashes above are PLACEHOLDERS.
-- On first deploy, run the seed script (backend/db/generate-seed.js) 
-- to generate real bcrypt hashes for your passwords.
