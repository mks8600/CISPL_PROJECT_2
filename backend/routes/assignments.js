import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('company'));

// GET /api/assignments — list assignments for current company
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assignments WHERE company_id = $1 ORDER BY assigned_at DESC',
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/assignments — assign sheet to vendor
router.post('/', async (req, res) => {
  const { sheetId, sheetData, vendorId, vendorName, vendorNo } = req.body;
  if (!sheetData || !vendorId) {
    return res.status(400).json({ error: 'sheetData and vendorId are required' });
  }

  try {
    const sections = sheetData.sections || [];
    const sectionStatuses = sections.map(() => 'pending');

    const result = await pool.query(
      `INSERT INTO assignments (company_id, company_name, vendor_id, vendor_name, vendor_no, sheet_id, sheet_data, section_statuses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.companyId, req.user.companyName, vendorId, vendorName, vendorNo, sheetId, sheetData, JSON.stringify(sectionStatuses)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// DELETE /api/assignments/:id — delete assignment (verify company ownership)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM assignments WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// PUT /api/assignments/:id/review — review vendor submission (bulk or single section)
router.put('/:id/review', async (req, res) => {
  const { sectionIndex, reviewStatus, reviewStatuses, reviewDescriptions, vendorData } = req.body;

  try {
    const current = await pool.query(
      'SELECT * FROM assignments WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.companyId]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    const assignment = current.rows[0];

    // Support both bulk (array of statuses) and single-section review
    let finalReviewStatuses;
    let finalReviewDescriptions;

    if (Array.isArray(reviewStatuses)) {
      // Bulk mode — the frontend sends the entire arrays
      finalReviewStatuses = reviewStatuses;
      finalReviewDescriptions = Array.isArray(reviewDescriptions) ? reviewDescriptions : (assignment.review_descriptions || []);
    } else {
      // Legacy single-section mode
      finalReviewStatuses = assignment.review_statuses || [];
      finalReviewStatuses[sectionIndex] = reviewStatus;
      finalReviewDescriptions = assignment.review_descriptions || [];
    }

    // Build the update query — save vendorData too if the company updated observations
    const updates = [
      'review_statuses = $1',
      'review_descriptions = $2',
      'updated_at = NOW()'
    ];
    const params = [JSON.stringify(finalReviewStatuses), JSON.stringify(finalReviewDescriptions)];
    let paramIdx = 3;

    if (vendorData !== undefined) {
      updates.push(`vendor_data = $${paramIdx}`);
      params.push(JSON.stringify(vendorData));
      paramIdx++;
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      params
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// PUT /api/assignments/:id/reassign — reassign to new vendor
router.put('/:id/reassign', async (req, res) => {
  const { vendorId, vendorName, vendorNo, sectionIndices, sheetData } = req.body;

  try {
    // Mark original sections as reassigned
    const current = await pool.query(
      'SELECT * FROM assignments WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.companyId]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    const assignment = current.rows[0];
    const sectionStatuses = assignment.section_statuses || [];
    for (const idx of sectionIndices) {
      sectionStatuses[idx] = 'reassigned';
    }

    await pool.query(
      'UPDATE assignments SET section_statuses = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(sectionStatuses), req.params.id]
    );

    // Create new child assignment
    const newSections = sheetData.sections || [];
    const newStatuses = newSections.map(() => 'pending');

    const result = await pool.query(
      `INSERT INTO assignments (company_id, company_name, vendor_id, vendor_name, vendor_no, sheet_data, section_statuses, reassigned_from)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.companyId, req.user.companyName, vendorId, vendorName, vendorNo, sheetData, JSON.stringify(newStatuses), req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Reassign error:', err);
    res.status(500).json({ error: 'Failed to reassign' });
  }
});

export default router;
