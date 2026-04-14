import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/superadmin
router.get('/superadmin', authenticate, requirePortal('superadmin'), async (req, res) => {
  try {
    const companies = await pool.query('SELECT COUNT(*) as count FROM companies');
    const vendors = await pool.query('SELECT COUNT(*) as count FROM vendors');
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    const assignments = await pool.query('SELECT COUNT(*) as count FROM assignments');

    res.json({
      totalCompanies: parseInt(companies.rows[0].count),
      totalVendors: parseInt(vendors.rows[0].count),
      totalUsers: parseInt(users.rows[0].count),
      totalAssignments: parseInt(assignments.rows[0].count),
    });
  } catch (err) {
    console.error('SuperAdmin dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/dashboard/company
router.get('/company', authenticate, requirePortal('company'), async (req, res) => {
  try {
    const total = await pool.query(
      'SELECT COUNT(*) as count FROM assignments WHERE company_id = $1',
      [req.user.companyId]
    );
    const pending = await pool.query(
      `SELECT COUNT(*) as count FROM assignments WHERE company_id = $1 AND status = 'pending'`,
      [req.user.companyId]
    );
    const accepted = await pool.query(
      `SELECT COUNT(*) as count FROM assignments WHERE company_id = $1 AND status = 'accepted' AND submitted = FALSE`,
      [req.user.companyId]
    );
    const submitted = await pool.query(
      `SELECT COUNT(*) as count FROM assignments WHERE company_id = $1 AND submitted = TRUE`,
      [req.user.companyId]
    );
    const sheets = await pool.query(
      'SELECT COUNT(*) as count FROM sheets WHERE company_id = $1',
      [req.user.companyId]
    );

    res.json({
      totalAssignments: parseInt(total.rows[0].count),
      pendingOrders: parseInt(pending.rows[0].count),
      inProgress: parseInt(accepted.rows[0].count),
      completedOrders: parseInt(submitted.rows[0].count),
      totalSheets: parseInt(sheets.rows[0].count),
    });
  } catch (err) {
    console.error('Company dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/dashboard/vendor
router.get('/vendor', authenticate, requirePortal('vendor'), async (req, res) => {
  try {
    const total = await pool.query(
      'SELECT COUNT(*) as count FROM assignments WHERE vendor_id = $1',
      [req.user.id]
    );
    const pending = await pool.query(
      `SELECT COUNT(*) as count FROM assignments WHERE vendor_id = $1 AND status = 'pending'`,
      [req.user.id]
    );
    const inProgress = await pool.query(
      `SELECT COUNT(*) as count FROM assignments WHERE vendor_id = $1 AND status = 'accepted' AND submitted = FALSE`,
      [req.user.id]
    );
    const submitted = await pool.query(
      `SELECT COUNT(*) as count FROM assignments WHERE vendor_id = $1 AND submitted = TRUE`,
      [req.user.id]
    );

    // Recent orders for dashboard
    const recent = await pool.query(
      `SELECT id, company_name, 
              COALESCE(sheet_data->'formData'->>'jobNo', sheet_data->'form_data'->>'jobNo', '') as job_no,
              COALESCE(sheet_data->'formData'->>'rsNo', sheet_data->'form_data'->>'rsNo', '') as rs_no,
              COALESCE(sheet_data->'formData'->>'date', sheet_data->'form_data'->>'date', '') as sheet_date,
              status, submitted, assigned_at
       FROM assignments WHERE vendor_id = $1
       ORDER BY assigned_at DESC LIMIT 5`,
      [req.user.id]
    );

    res.json({
      totalOrders: parseInt(total.rows[0].count),
      pendingOrders: parseInt(pending.rows[0].count),
      inProgress: parseInt(inProgress.rows[0].count),
      completedOrders: parseInt(submitted.rows[0].count),
      recentOrders: recent.rows,
    });
  } catch (err) {
    console.error('Vendor dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
