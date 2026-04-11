import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('company'));

// GET /api/jobs — list jobs for current company
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC',
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// POST /api/jobs — create job number
router.post('/', async (req, res) => {
  const { jobNo, description } = req.body;
  if (!jobNo) return res.status(400).json({ error: 'jobNo is required' });

  try {
    const result = await pool.query(
      'INSERT INTO jobs (company_id, job_no, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.companyId, jobNo.trim(), description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Job number already exists' });
    }
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// DELETE /api/jobs/:id — delete job number
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
