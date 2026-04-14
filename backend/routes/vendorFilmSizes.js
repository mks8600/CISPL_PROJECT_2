import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('vendor'));

// GET /api/vendor-film-sizes — list film sizes for current vendor
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, size_label as size FROM vendor_film_sizes WHERE vendor_id = $1 ORDER BY size_label ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get vendor film sizes error:', err);
    res.status(500).json({ error: 'Failed to fetch vendor film sizes' });
  }
});

// POST /api/vendor-film-sizes — create vendor film size
router.post('/', async (req, res) => {
  const { size } = req.body;
  if (!size) return res.status(400).json({ error: 'size is required' });

  try {
    const result = await pool.query(
      'INSERT INTO vendor_film_sizes (vendor_id, size_label) VALUES ($1, $2) RETURNING id, size_label as size',
      [req.user.id, size.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Film size already exists' });
    }
    console.error('Create vendor film size error:', err);
    res.status(500).json({ error: 'Failed to create vendor film size' });
  }
});

// DELETE /api/vendor-film-sizes/:id — delete vendor film size
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM vendor_film_sizes WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor film size not found' });
    }
    res.json({ message: 'Vendor film size deleted' });
  } catch (err) {
    console.error('Delete vendor film size error:', err);
    res.status(500).json({ error: 'Failed to delete vendor film size' });
  }
});

export default router;
