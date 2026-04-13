import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

// All routes require superadmin or company portal
router.use(authenticate, requirePortal('superadmin', 'company'));

// GET /api/vendors — list all vendors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, vendor_no, vendor_name, login_id, created_at, updated_at FROM vendors ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get vendors error:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST /api/vendors — create vendor
router.post('/', async (req, res) => {
  const { vendorNo, vendorName } = req.body;
  if (!vendorNo || !vendorName) {
    return res.status(400).json({ error: 'vendorNo and vendorName are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO vendors (vendor_no, vendor_name) VALUES ($1, $2) RETURNING id, vendor_no, vendor_name, created_at',
      [vendorNo.trim(), vendorName.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Vendor number already exists' });
    }
    console.error('Create vendor error:', err);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// DELETE /api/vendors/:id — delete vendor
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vendors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted' });
  } catch (err) {
    console.error('Delete vendor error:', err);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// POST /api/vendors/:id/credentials — set vendor login credentials
router.post('/:id/credentials', async (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) {
    return res.status(400).json({ error: 'loginId and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE vendors SET login_id = $1, password = $2, updated_at = NOW() WHERE id = $3 RETURNING id, vendor_no, vendor_name, login_id',
      [loginId.trim().toLowerCase(), hashedPassword, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor credentials set', vendor: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Login ID already in use by another vendor' });
    }
    console.error('Set vendor credentials error:', err);
    res.status(500).json({ error: 'Failed to set vendor credentials' });
  }
});

export default router;
