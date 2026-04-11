import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

// All routes require superadmin
router.use(authenticate, requirePortal('superadmin'));

// GET /api/companies — list all organizations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// POST /api/companies — create organization
router.post('/', async (req, res) => {
  const { orgCode, name } = req.body;
  if (!orgCode || !name) {
    return res.status(400).json({ error: 'orgCode and name are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO companies (org_code, name) VALUES ($1, $2) RETURNING *',
      [orgCode.trim().toUpperCase(), name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Organization code already exists' });
    }
    console.error('Create company error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// DELETE /api/companies/:id — delete organization and its users
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM companies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json({ message: 'Company deleted', company: result.rows[0] });
  } catch (err) {
    console.error('Delete company error:', err);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// POST /api/companies/:id/credentials — set admin user for organization
router.post('/:id/credentials', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Verify company exists
    const comp = await pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (comp.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert user
    const result = await pool.query(
      `INSERT INTO users (company_id, email, password, name, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email, company_id) 
       DO UPDATE SET password = $3, name = $4, role = 'admin'
       RETURNING id, email, name, role`,
      [req.params.id, email.trim().toLowerCase(), hashedPassword, name || 'Admin User']
    );

    res.json({ message: 'Credentials set', user: result.rows[0] });
  } catch (err) {
    console.error('Set credentials error:', err);
    res.status(500).json({ error: 'Failed to set credentials' });
  }
});

export default router;
