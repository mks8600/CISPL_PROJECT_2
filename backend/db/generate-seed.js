// Seed script — generates proper bcrypt hashes and inserts seed data
// Run: node db/generate-seed.js

import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Hash passwords
    const adminHash = await bcrypt.hash('admin', 10);
    const vendorHash = await bcrypt.hash('vendor123', 10);

    // Super Admin
    await client.query(
      `INSERT INTO super_admins (email, password, name) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      ['superadmin', adminHash, 'Master Administrator']
    );
    console.log('✅ Super admin created (superadmin / admin)');

    // Companies
    const c1 = await client.query(
      `INSERT INTO companies (org_code, name) VALUES ($1, $2)
       ON CONFLICT (org_code) DO UPDATE SET name = $2
       RETURNING id`,
      ['CISPL', 'Crystal Industries & Solutions Pvt. Ltd.']
    );
    const c2 = await client.query(
      `INSERT INTO companies (org_code, name) VALUES ($1, $2)
       ON CONFLICT (org_code) DO UPDATE SET name = $2
       RETURNING id`,
      ['ACME', 'Acme Corp']
    );
    console.log('✅ Companies created (CISPL, ACME)');

    // Company Users
    await client.query(
      `INSERT INTO users (company_id, email, password, name, role) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email, company_id) DO NOTHING`,
      [c1.rows[0].id, 'admin', adminHash, 'Admin User', 'admin']
    );
    await client.query(
      `INSERT INTO users (company_id, email, password, name, role) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email, company_id) DO NOTHING`,
      [c2.rows[0].id, 'admin', adminHash, 'Acme Admin', 'admin']
    );
    console.log('✅ Company users created (admin / admin)');

    // Vendors
    const vendorData = [
      ['V001', 'FilmWorks Ltd', 'vendor@filmworks.com'],
      ['V002', 'Industrial Films Co', 'vendor@industrialfilms.com'],
      ['V003', 'Quality Films Inc', 'vendor@qualityfilms.com'],
    ];

    for (const [vno, vname, loginId] of vendorData) {
      await client.query(
        `INSERT INTO vendors (vendor_no, vendor_name, login_id, password) VALUES ($1, $2, $3, $4)
         ON CONFLICT (vendor_no) DO NOTHING`,
        [vno, vname, loginId, vendorHash]
      );
    }
    console.log('✅ Vendors created (vendor@filmworks.com / vendor123, etc.)');

    await client.query('COMMIT');
    console.log('\n🎉 Seed complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
