import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requirePortal } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requirePortal('company'));

// GET /api/billing — billing summary with filters
// Query params: startDate, endDate, vendorId, jobNo
router.get('/', async (req, res) => {
  const { startDate, endDate, vendorId, jobNo } = req.query;

  try {
    // Get all completed/submitted assignments for this company
    let query = `
      SELECT a.*, a.sheet_data->'formData'->>'date' as sheet_date,
             a.sheet_data->'formData'->>'jobNo' as sheet_job_no
      FROM assignments a
      WHERE a.company_id = $1
        AND a.submitted = TRUE
        AND a.status = 'accepted'
    `;
    const params = [req.user.companyId];
    let paramIdx = 2;

    if (startDate) {
      query += ` AND (a.sheet_data->'formData'->>'date') >= $${paramIdx}`;
      params.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      query += ` AND (a.sheet_data->'formData'->>'date') <= $${paramIdx}`;
      params.push(endDate);
      paramIdx++;
    }
    if (vendorId && vendorId !== 'all') {
      query += ` AND a.vendor_id = $${paramIdx}`;
      params.push(vendorId);
      paramIdx++;
    }
    if (jobNo && jobNo !== 'all') {
      query += ` AND a.sheet_data->'formData'->>'jobNo' = $${paramIdx}`;
      params.push(jobNo);
      paramIdx++;
    }

    query += ' ORDER BY sheet_date DESC';

    const result = await pool.query(query, params);
    const assignments = result.rows;

    // Aggregate film size totals
    const filmSizeTotals = {};
    let totalSpotsAll = 0;

    for (const assignment of assignments) {
      const vendorData = assignment.vendor_data;
      if (!vendorData) continue;

      // vendorData is indexed by [sectionIdx][rowIdx]
      for (const sectionKey of Object.keys(vendorData)) {
        const sectionData = vendorData[sectionKey];
        if (!sectionData) continue;

        for (const rowKey of Object.keys(sectionData)) {
          const rowData = sectionData[rowKey];
          if (rowData && rowData.filmSize && rowData.filmSize.trim() !== '') {
            const size = rowData.filmSize.trim();
            const spotCount = parseInt(rowData.spotNo) || 0;
            filmSizeTotals[size] = (filmSizeTotals[size] || 0) + spotCount;
            totalSpotsAll += spotCount;
          }
        }
      }
    }

    // Get unique vendors and job numbers for filter dropdowns
    const vendorsResult = await pool.query(
      `SELECT DISTINCT vendor_id, vendor_name FROM assignments
       WHERE company_id = $1 AND submitted = TRUE AND status = 'accepted'`,
      [req.user.companyId]
    );

    const jobNosResult = await pool.query(
      `SELECT DISTINCT sheet_data->'formData'->>'jobNo' as job_no FROM assignments
       WHERE company_id = $1 AND submitted = TRUE AND status = 'accepted'
       AND sheet_data->'formData'->>'jobNo' IS NOT NULL`,
      [req.user.companyId]
    );

    res.json({
      filmSizeTotals,
      totalSpotsAll,
      sheetCount: assignments.length,
      vendors: vendorsResult.rows,
      jobNos: jobNosResult.rows.map(r => r.job_no).filter(Boolean),
    });
  } catch (err) {
    console.error('Billing error:', err);
    res.status(500).json({ error: 'Failed to calculate billing' });
  }
});

export default router;
