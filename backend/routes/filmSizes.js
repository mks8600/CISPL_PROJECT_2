import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('company'));

// GET /api/film-sizes — list film sizes for current company
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM film_sizes WHERE company_id = $1 ORDER BY size_label ASC',
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get film sizes error:', err);
    res.status(500).json({ error: 'Failed to fetch film sizes' });
  }
});

// POST /api/film-sizes — create film size
router.post('/', async (req, res) => {
  const { sizeLabel } = req.body;
  if (!sizeLabel) return res.status(400).json({ error: 'sizeLabel is required' });

  try {
    const result = await pool.query(
      'INSERT INTO film_sizes (company_id, size_label) VALUES ($1, $2) RETURNING *',
      [req.user.companyId, sizeLabel.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Film size already exists' });
    }
    console.error('Create film size error:', err);
    res.status(500).json({ error: 'Failed to create film size' });
  }
});

// DELETE /api/film-sizes/:id — delete film size
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM film_sizes WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film size not found' });
    }
    res.json({ message: 'Film size deleted' });
  } catch (err) {
    console.error('Delete film size error:', err);
    res.status(500).json({ error: 'Failed to delete film size' });
  }
});

export default router;
