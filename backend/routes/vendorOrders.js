import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('vendor'));

// Helper: Normalize a raw DB assignment row into the camelCase shape
// that the frontend expects (identical to the old localStorage format).
function normalizeAssignment(row) {
  const sheetData = row.sheet_data || {};
  const sections = Array.isArray(sheetData.sections)
    ? sheetData.sections.map(sec => ({
        ...sec,
        rows: Array.isArray(sec.rows) ? sec.rows : []
      }))
    : [];

  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorNo: row.vendor_no,
    sheetId: row.sheet_id,
    status: row.status,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    assignedAt: row.assigned_at,
    respondedAt: row.updated_at,
    reassignedFrom: row.reassigned_from,

    // The sheet object — exactly like localStorage had it
    sheet: {
      formData: sheetData.form_data || sheetData.formData || {},
      sections,
    },

    // Vendor-specific working data
    vendorData: row.vendor_data || {},
    sectionStatuses: Array.isArray(row.section_statuses) ? row.section_statuses : sections.map(() => 'pending'),
    reviewStatuses: Array.isArray(row.review_statuses) ? row.review_statuses : sections.map(() => null),
    reviewDescriptions: Array.isArray(row.review_descriptions) ? row.review_descriptions : sections.map(() => ''),
  };
}

// GET /api/vendor-orders — list orders assigned to this vendor
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assignments WHERE vendor_id = $1 ORDER BY assigned_at DESC',
      [req.user.id]
    );
    res.json(result.rows.map(normalizeAssignment));
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
    res.json(normalizeAssignment(result.rows[0]));
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
    res.json(normalizeAssignment(result.rows[0]));
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
      [vendorData ? JSON.stringify(vendorData) : null, JSON.stringify(sectionStatuses), req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(normalizeAssignment(result.rows[0]));
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
      [vendorData ? JSON.stringify(vendorData) : null, JSON.stringify(sectionStatuses), req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(normalizeAssignment(result.rows[0]));
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit work' });
  }
});

export default router;
