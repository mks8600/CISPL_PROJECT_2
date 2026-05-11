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
      SELECT a.*, 
             COALESCE(a.sheet_data->'formData'->>'date', a.sheet_data->'form_data'->>'date', '') as sheet_date,
             COALESCE(a.sheet_data->'formData'->>'jobNo', a.sheet_data->'form_data'->>'jobNo', '') as sheet_job_no
      FROM assignments a
      WHERE a.company_id = $1
        AND a.submitted = TRUE
        AND a.status = 'accepted'
    `;
    const params = [req.user.companyId];
    let paramIdx = 2;

    if (startDate) {
      query += ` AND COALESCE(a.sheet_data->'formData'->>'date', a.sheet_data->'form_data'->>'date', '') >= $${paramIdx}`;
      params.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      query += ` AND COALESCE(a.sheet_data->'formData'->>'date', a.sheet_data->'form_data'->>'date', '') <= $${paramIdx}`;
      params.push(endDate);
      paramIdx++;
    }
    if (vendorId && vendorId !== 'all') {
      query += ` AND a.vendor_id = $${paramIdx}`;
      params.push(vendorId);
      paramIdx++;
    }
    if (jobNo && jobNo !== 'all') {
      query += ` AND COALESCE(a.sheet_data->'formData'->>'jobNo', a.sheet_data->'form_data'->>'jobNo', '') = $${paramIdx}`;
      params.push(jobNo);
      paramIdx++;
    }

    query += ' ORDER BY sheet_date DESC';

    const result = await pool.query(query, params);
    const assignments = result.rows;

    // Aggregate film size totals + status counts + detailed rows
    const filmSizeTotals = {};
    const statusCounts = { OK: 0, Repair: 0, 'R/S': 0, Retake: 0, Missing: 0 };
    let totalSpotsAll = 0;
    const detailedRows = [];

    for (const assignment of assignments) {
      const vendorData = assignment.vendor_data;
      if (!vendorData) continue;

      const sheetData = assignment.sheet_data || {};
      const formData = sheetData.formData || sheetData.form_data || {};
      const sections = sheetData.sections || [];

      // vendorData is indexed by [sectionIdx][rowIdx]
      for (const sectionKey of Object.keys(vendorData)) {
        const sectionData = vendorData[sectionKey];
        if (!sectionData) continue;

        const sIdx = parseInt(sectionKey);
        const section = sections[sIdx] || {};
        const serialNo = section.serialNo || '';

        for (const rowKey of Object.keys(sectionData)) {
          const rowData = sectionData[rowKey];
          if (rowData && rowData.filmSize && rowData.filmSize.trim() !== '') {
            const rIdx = parseInt(rowKey);
            const row = (section.rows || [])[rIdx] || {};
            const size = rowData.filmSize.trim();
            const spotCount = parseInt(rowData.spotNo) || 0;
            filmSizeTotals[size] = (filmSizeTotals[size] || 0) + spotCount;
            totalSpotsAll += spotCount;

            // Build weld identification string: CISPL/JOB NO./TAG NO./CS/W NO/THK
            const weldId = row.jobWeldDescription || row.description || row.weldId || row.drawingNo || '—';

            // Observations for this row
            const obsArray = rowData.observations || [];
            const observations = [];
            if (obsArray.length > 0) {
              for (const obs of obsArray) {
                const status = obs.companyValue || 'OK';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
                observations.push({
                  label: obs.label || '',
                  vendorValue: obs.value || '',
                  companyValue: status,
                });
              }
            } else {
              statusCounts['OK'] = (statusCounts['OK'] || 0) + spotCount;
              // Create placeholder observations
              for (let i = 0; i < spotCount; i++) {
                observations.push({ label: `${i}`, vendorValue: '', companyValue: 'OK' });
              }
            }

            detailedRows.push({
              date: formData.date || '',
              jobNo: formData.jobNo || '',
              rsNo: formData.rsNo || '',
              serialNo,
              weldIdentification: weldId,
              spotNo: spotCount,
              filmSize: size,
              observations,
              vendorName: assignment.vendor_name || '',
            });
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
      `SELECT DISTINCT COALESCE(sheet_data->'formData'->>'jobNo', sheet_data->'form_data'->>'jobNo', '') as job_no FROM assignments
       WHERE company_id = $1 AND submitted = TRUE AND status = 'accepted'
       AND (sheet_data->'formData'->>'jobNo' IS NOT NULL OR sheet_data->'form_data'->>'jobNo' IS NOT NULL)`,
      [req.user.companyId]
    );

    res.json({
      filmSizeTotals,
      totalSpotsAll,
      statusCounts,
      detailedRows,
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
