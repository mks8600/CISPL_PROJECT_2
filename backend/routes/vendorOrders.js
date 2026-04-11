import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('vendor'));

// GET /api/vendor-orders — list orders assigned to this vendor
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assignments WHERE vendor_id = $1 ORDER BY assigned_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get vendor orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/vendor-orders/:id/accept — accept order
router.put('/:id/accept', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE assignments SET status = 'accepted', updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2 AND status = 'pending' RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Accept order error:', err);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// PUT /api/vendor-orders/:id/decline — decline order
router.put('/:id/decline', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE assignments SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2 AND status = 'pending' RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Decline order error:', err);
    res.status(500).json({ error: 'Failed to decline order' });
  }
});

// PUT /api/vendor-orders/:id/data — save vendor data (spot no, film size, observations)
router.put('/:id/data', async (req, res) => {
  const { vendorData, sectionStatuses } = req.body;

  try {
    const result = await pool.query(
      `UPDATE assignments SET vendor_data = $1, section_statuses = $2, updated_at = NOW()
       WHERE id = $3 AND vendor_id = $4 RETURNING *`,
      [vendorData, JSON.stringify(sectionStatuses), req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save vendor data error:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// PUT /api/vendor-orders/:id/submit — submit completed work to company
router.put('/:id/submit', async (req, res) => {
  const { vendorData, sectionStatuses } = req.body;

  try {
    const result = await pool.query(
      `UPDATE assignments SET 
         vendor_data = $1, section_statuses = $2,
         submitted = TRUE, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND vendor_id = $4 RETURNING *`,
      [vendorData, JSON.stringify(sectionStatuses), req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit work' });
  }
});

export default router;
