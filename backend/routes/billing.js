import { Router } from 'express';
import bcrypt from 'bcrypt';
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
            const rawSpotCount = parseInt(rowData.spotNo) || 0;
            
            // Skip zero-spot rows to prevent cluttering billing calculations
            if (rawSpotCount <= 0) continue;

            // Cap at 100 to prevent DoS via excessive memory allocation
            const spotCount = Math.min(rawSpotCount, 100);

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
              vendorId: assignment.vendor_id || '',
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

// GET /api/billing/pricing-password/status — Check if password is set
router.get('/pricing-password/status', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT pricing_password IS NOT NULL AND pricing_password <> \'\' AS is_set FROM companies WHERE id = $1',
      [req.user.companyId]
    );
    const isSet = result.rows[0]?.is_set || false;
    res.json({ isSet });
  } catch (err) {
    console.error('Password status error:', err);
    res.status(500).json({ error: 'Failed to check pricing password status' });
  }
});

// POST /api/billing/pricing-password/setup — Setup or change password
router.post('/pricing-password/setup', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.trim() === '') {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    const compResult = await pool.query(
      'SELECT pricing_password FROM companies WHERE id = $1',
      [req.user.companyId]
    );
    const currentHash = compResult.rows[0]?.pricing_password;

    if (currentHash) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Old password is required to change it' });
      }
      const valid = await bcrypt.compare(oldPassword, currentHash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE companies SET pricing_password = $1, updated_at = NOW() WHERE id = $2',
      [hashed, req.user.companyId]
    );

    res.json({ success: true, message: currentHash ? 'Password updated successfully' : 'Password set successfully' });
  } catch (err) {
    console.error('Setup password error:', err);
    res.status(500).json({ error: 'Failed to set pricing password' });
  }
});

// POST /api/billing/pricing-password/verify — Verify password to unlock
router.post('/pricing-password/verify', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const compResult = await pool.query(
      'SELECT pricing_password FROM companies WHERE id = $1',
      [req.user.companyId]
    );
    const currentHash = compResult.rows[0]?.pricing_password;

    if (!currentHash) {
      return res.status(400).json({ error: 'Pricing password has not been configured yet' });
    }

    const valid = await bcrypt.compare(password, currentHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Verify password error:', err);
    res.status(500).json({ error: 'Failed to verify pricing password' });
  }
});

// GET /api/billing/prices — Get all stored prices for this company
router.get('/prices', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT vendor_id, film_size, price_per_spot FROM film_size_prices WHERE company_id = $1',
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get prices error:', err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// POST /api/billing/prices — Save prices for a vendor
router.post('/prices', async (req, res) => {
  const { vendorId, prices } = req.body;
  if (!vendorId || !prices) {
    return res.status(400).json({ error: 'vendorId and prices are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const [filmSize, price] of Object.entries(prices)) {
      const priceVal = parseFloat(price) || 0;
      await client.query(
        `INSERT INTO film_size_prices (company_id, vendor_id, film_size, price_per_spot)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, vendor_id, film_size)
         DO UPDATE SET price_per_spot = EXCLUDED.price_per_spot, updated_at = NOW()`,
        [req.user.companyId, vendorId, filmSize, priceVal]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Prices saved successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save prices error:', err);
    res.status(500).json({ error: 'Failed to save prices' });
  } finally {
    client.release();
  }
});

export default router;
