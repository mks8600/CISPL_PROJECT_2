import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, portal, orgCode } = req.body;

  if (!email || !password || !portal) {
    return res.status(400).json({ error: 'Email, password, and portal are required' });
  }

  try {
    // ── Super Admin Login ──
    if (portal === 'superadmin') {
      const result = await pool.query(
        'SELECT * FROM super_admins WHERE LOWER(email) = LOWER($1)',
        [email.trim()]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const admin = result.rows[0];
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: admin.id, email: admin.email, name: admin.name, portalType: 'superadmin', role: 'superadmin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: { id: admin.id, email: admin.email, name: admin.name, portalType: 'superadmin', role: 'superadmin' }
      });
    }

    // ── Company Login ──
    if (portal === 'company') {
      if (!orgCode) return res.status(400).json({ error: 'Organization code is required' });

      const compResult = await pool.query(
        'SELECT * FROM companies WHERE LOWER(org_code) = LOWER($1)',
        [orgCode.trim()]
      );
      if (compResult.rows.length === 0) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const company = compResult.rows[0];

      const userResult = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND company_id = $2',
        [email.trim(), company.id]
      );
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        {
          id: user.id, email: user.email, name: user.name,
          portalType: 'company', role: user.role,
          companyId: company.id, companyName: company.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: {
          id: user.id, email: user.email, name: user.name,
          portalType: 'company', role: user.role,
          companyId: company.id, companyName: company.name
        }
      });
    }

    // ── Vendor Login ──
    if (portal === 'vendor') {
      const result = await pool.query(
        'SELECT * FROM vendors WHERE LOWER(login_id) = LOWER($1)',
        [email.trim()]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const vendor = result.rows[0];
      if (!vendor.password) {
        return res.status(401).json({ error: 'Vendor account not yet activated. Contact admin.' });
      }

      const valid = await bcrypt.compare(password, vendor.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: vendor.id, vendorNo: vendor.vendor_no, vendorName: vendor.vendor_name, portalType: 'vendor' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: {
          id: vendor.id, vendorNo: vendor.vendor_no, vendorName: vendor.vendor_name,
          portalType: 'vendor', vendorId: vendor.id
        }
      });
    }

    return res.status(400).json({ error: 'Invalid portal type' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
