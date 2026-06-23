import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('company'));

// GET /api/sheets — list sheets for current company
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sheets WHERE company_id = $1 ORDER BY saved_at DESC',
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get sheets error:', err);
    res.status(500).json({ error: 'Failed to fetch sheets' });
  }
});

// POST /api/sheets — create or update sheet
router.post('/', async (req, res) => {
  const { id, formData, sections } = req.body;
  if (!formData || !sections) {
    return res.status(400).json({ error: 'formData and sections are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the table to serialize duplicate checks
    await client.query('LOCK TABLE sheets IN SHARE ROW EXCLUSIVE MODE');

    if (id) {
      // Update existing sheet (verify ownership)
      const result = await client.query(
        `UPDATE sheets SET form_data = $1, sections = $2, updated_at = NOW()
         WHERE id = $3 AND company_id = $4 RETURNING *`,
        [JSON.stringify(formData), JSON.stringify(sections), id, req.user.companyId]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Sheet not found' });
      }
      await client.query('COMMIT');
      return res.json(result.rows[0]);
    }

    // Check for duplicate (same rsNo)
    let dup = { rows: [] };
    if (formData.rsNo) {
      dup = await client.query(
        `SELECT id FROM sheets WHERE company_id = $1 AND form_data->>'rsNo' = $2`,
        [req.user.companyId, formData.rsNo]
      );
    }

    if (dup.rows.length > 0) {
      // Overwrite duplicate
      const result = await client.query(
        `UPDATE sheets SET form_data = $1, sections = $2, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [JSON.stringify(formData), JSON.stringify(sections), dup.rows[0].id]
      );
      await client.query('COMMIT');
      return res.json(result.rows[0]);
    }

    // Create new
    const result = await client.query(
      `INSERT INTO sheets (company_id, company_name, form_data, sections)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.companyId, req.user.companyName, JSON.stringify(formData), JSON.stringify(sections)]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save sheet error:', err);
    res.status(500).json({ error: 'Failed to save sheet' });
  } finally {
    client.release();
  }
});

// DELETE /api/sheets/:id — delete sheet (verify ownership)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM sheets WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sheet not found' });
    }
    res.json({ message: 'Sheet deleted' });
  } catch (err) {
    console.error('Delete sheet error:', err);
    res.status(500).json({ error: 'Failed to delete sheet' });
  }
});

export default router;
