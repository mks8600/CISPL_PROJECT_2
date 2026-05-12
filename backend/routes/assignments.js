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

// DELETE /api/assignments/:id
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

// PUT /api/assignments/:id/review — review vendor submission
router.put('/:id/review', async (req, res) => {
  const { sectionIndex, reviewStatus, reviewStatuses, reviewDescriptions, vendorData } = req.body;

  try {
    const current = await pool.query(
      'SELECT * FROM assignments WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.companyId]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    const assignment = current.rows[0];
    let finalReviewStatuses;
    let finalReviewDescriptions;

    if (Array.isArray(reviewStatuses)) {
      finalReviewStatuses = reviewStatuses;
      finalReviewDescriptions = Array.isArray(reviewDescriptions) ? reviewDescriptions : (assignment.review_descriptions || []);
    } else {
      finalReviewStatuses = assignment.review_statuses || [];
      finalReviewStatuses[sectionIndex] = reviewStatus;
      finalReviewDescriptions = assignment.review_descriptions || [];
    }

    const updates = ['review_statuses = $1', 'review_descriptions = $2', 'updated_at = NOW()'];
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

// PUT /api/assignments/:id/complete-with-revision
// Splits at the OBSERVATION level: keeps OK/Repair/R/S in original, moves Retake/Missing to revision
router.put('/:id/complete-with-revision', async (req, res) => {
  const { vendorData, reviewStatuses: incomingReviewStatuses, reviewDescriptions: incomingReviewDescriptions } = req.body;

  try {
    const current = await pool.query(
      'SELECT * FROM assignments WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.companyId]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    const assignment = current.rows[0];
    const sheetData = JSON.parse(JSON.stringify(assignment.sheet_data || {}));
    const formData = sheetData.formData || sheetData.form_data || {};
    const sections = sheetData.sections || [];
    const sectionStatuses = assignment.section_statuses || sections.map(() => 'pending');
    const vData = JSON.parse(JSON.stringify(vendorData || assignment.vendor_data || {}));

    const finalReviewStatuses = Array.isArray(incomingReviewStatuses)
      ? [...incomingReviewStatuses] : sections.map(() => null);
    const finalReviewDescriptions = Array.isArray(incomingReviewDescriptions)
      ? [...incomingReviewDescriptions] : sections.map(() => '');

    const revisionSections = [];

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      if (sectionStatuses[sIdx] === 'reassigned') continue;

      const section = sections[sIdx];
      const rows = section.rows || [];
      let sectionHasRetake = false;
      const revRows = [];
      const revSectionVData = {};

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const rowVData = (vData[sIdx] && vData[sIdx][rIdx]) || {};
        const obsArray = rowVData.observations || [];

        const keepObs = [];
        const moveObs = [];

        for (const obs of obsArray) {
          if (obs.companyValue === 'Retake' || obs.companyValue === 'Missing') {
            moveObs.push(obs);
          } else {
            keepObs.push(obs);
          }
        }

        if (moveObs.length > 0) {
          sectionHasRetake = true;

          // Revision sheet gets this row with only Retake/Missing spots
          const revRowIdx = revRows.length;
          revRows.push({ ...rows[rIdx] });
          revSectionVData[revRowIdx] = {
            spotNo: moveObs.length.toString(),
            filmSize: rowVData.filmSize || '',
            observations: moveObs.map(o => ({
              label: o.label,
              value: '',               // Reset vendor value for re-doing
              companyValue: o.companyValue, // Keep company value so they know it's Retake/Missing
            })),
            remark: '',
          };

          // Original keeps only OK/Repair/R/S observations
          vData[sIdx][rIdx] = {
            ...rowVData,
            spotNo: keepObs.length > 0 ? keepObs.length.toString() : '0',
            observations: keepObs,
          };
        }
      }

      if (sectionHasRetake) {
        revisionSections.push({
          serialNo: section.serialNo || '',
          rows: revRows,
          vendorData: revSectionVData,
        });

        let hasRepair = false, hasRS = false;
        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const rowVData = (vData[sIdx] && vData[sIdx][rIdx]) || {};
          for (const obs of (rowVData.observations || [])) {
            if (obs.companyValue === 'Repair') hasRepair = true;
            if (obs.companyValue === 'R/S') hasRS = true;
          }
        }
        finalReviewStatuses[sIdx] = hasRepair ? 'repair' : hasRS ? 'r/s' : 'ok';
        finalReviewDescriptions[sIdx] = 'Retake/Missing spots moved to revision sheet.';
      } else {
        let hasRepair = false, hasRS = false;
        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const rowVData = (vData[sIdx] && vData[sIdx][rIdx]) || {};
          for (const obs of (rowVData.observations || [])) {
            if (obs.companyValue === 'Repair') hasRepair = true;
            if (obs.companyValue === 'R/S') hasRS = true;
          }
        }
        finalReviewStatuses[sIdx] = hasRepair ? 'repair' : hasRS ? 'r/s' : 'ok';
        finalReviewDescriptions[sIdx] = '';
      }
    }

    // Update original — sheet_data stays intact, only vendor_data observations cleaned
    await pool.query(
      `UPDATE assignments SET review_statuses = $1, review_descriptions = $2, vendor_data = $3, updated_at = NOW() WHERE id = $4`,
      [JSON.stringify(finalReviewStatuses), JSON.stringify(finalReviewDescriptions), JSON.stringify(vData), req.params.id]
    );

    let revisionAssignment = null;

    if (revisionSections.length > 0) {
      const originalRsNo = formData.rsNo || '';
      const baseRsNo = originalRsNo.replace(/ rev-\d+$/, '');

      const existingRevisions = await pool.query(
        `SELECT sheet_data FROM assignments WHERE company_id = $1
         AND (
           sheet_data->'formData'->>'rsNo' LIKE $2
           OR sheet_data->'form_data'->>'rsNo' LIKE $2
         )`,
        [req.user.companyId, `${baseRsNo} rev-%`]
      );

      let maxRev = 0;
      for (const row of existingRevisions.rows) {
        const sd = row.sheet_data || {};
        const fd = sd.formData || sd.form_data || {};
        const match = (fd.rsNo || '').match(/rev-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxRev) maxRev = num;
        }
      }
      const newRsNo = `${baseRsNo} rev-${maxRev + 1}`;

      // Build revision sheet with vendor_data included (spot no, film size, observation labels)
      const revVData = {};
      const revisionSheetData = {
        formData: { ...formData, rsNo: newRsNo },
        sections: revisionSections.map((rs, newSIdx) => {
          revVData[newSIdx] = rs.vendorData;
          return { serialNo: rs.serialNo, rows: rs.rows };
        }),
      };

      const newStatuses = revisionSections.map(() => 'pending');

      const revResult = await pool.query(
        `INSERT INTO assignments (company_id, company_name, sheet_data, section_statuses, vendor_data, reassigned_from)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          req.user.companyId,
          req.user.companyName,
          revisionSheetData,
          JSON.stringify(newStatuses),
          JSON.stringify(revVData),
          req.params.id,
        ]
      );

      revisionAssignment = revResult.rows[0];
    }

    const updated = await pool.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);

    res.json({
      original: updated.rows[0],
      revision: revisionAssignment,
      revisionCreated: revisionAssignment !== null,
    });
  } catch (err) {
    console.error('Complete-with-revision error:', err);
    res.status(500).json({ error: 'Failed to complete review with revision' });
  }
});

export default router;
