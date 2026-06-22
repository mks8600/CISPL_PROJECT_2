/**
 * exportPdf.js — Generates a professional PDF for a completed assignment sheet.
 *
 * Uses jsPDF + jspdf-autotable to render:
 *   1. A company header with title
 *   2. Sheet metadata (Job No, Date, RS No, Vendor)
 *   3. Each section table with weld descriptions, vendor/company observations
 *   4. A film-size summary table at the bottom
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * @param {Object} assignment — a single completed assignment object (already
 *   enriched with `resolvedSections` by CompanyCompletedWorkPage).
 */
export function exportAssignmentPdf(assignment) {
    const sheetData = assignment.sheet_data || assignment.sheet || {};
    const fd = sheetData.form_data || sheetData.formData || {};
    const allSections = assignment.resolvedSections || [];
    const vendorName = assignment.vendor_name || assignment.vendorName || '—';
    const vendorNo = assignment.vendor_no || assignment.vendorNo || '';

    // --- Initialise PDF (A4, landscape for wider tables) ---
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 10;
    const contentW = pageW - 2 * marginX;
    let curY = 12;

    // ========================================================
    // 1. TITLE
    // ========================================================
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Radiographic Requisition Sheet — Completed Report', pageW / 2, curY, { align: 'center' });
    curY += 10;

    // ========================================================
    // 2. METADATA BLOCK
    // ========================================================
    doc.setFontSize(10);
    doc.setDrawColor(148, 163, 184); // slate-400

    // Draw a rounded rect background
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(marginX, curY, contentW, 16, 2, 2, 'F');

    const col1X = marginX + 4;
    const col2X = marginX + contentW * 0.25;
    const col3X = marginX + contentW * 0.5;
    const col4X = marginX + contentW * 0.75;
    const metaY = curY + 6;
    const metaY2 = curY + 12;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Job No:', col1X, metaY);
    doc.text('Date:', col2X, metaY);
    doc.text('Vendor:', col3X, metaY);
    doc.text('RS No:', col4X, metaY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(fd.jobNo || '—', col1X + 18, metaY);
    doc.text(fmtDate(fd.date), col2X + 14, metaY);
    doc.text(`${vendorName}${vendorNo ? ` (${vendorNo})` : ''}`, col3X + 18, metaY);
    doc.text(String(fd.rsNo || '—'), col4X + 16, metaY);

    // Optional: Submitted date
    const submittedAt = assignment.submitted_at || assignment.submittedAt;
    if (submittedAt) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Submitted: ${fmtDate(submittedAt)}`, col1X, metaY2);
    }

    curY += 20;

    // ========================================================
    // 3. SECTION TABLES
    // ========================================================
    const filmSizeTotals = {};
    let totalSpotsAll = 0;

    allSections.forEach((item, sIdx) => {
        const section = item.section;
        const vDataMap = item.vDataMap;
        const reviewStatus = item.reviewStatus || '—';
        const rows = section.rows || [];

        // Section header label
        curY += 2;
        if (curY > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            curY = 12;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const reviewLabel =
            reviewStatus === 'ok'
                ? '✓ OK'
                : reviewStatus === 'repair'
                  ? '⚠ Repair'
                  : reviewStatus === 'r/s'
                    ? 'R/S'
                    : reviewStatus;

        doc.text(
            `Section ${sIdx + 1}  —  Serial No: ${section.serialNo || '—'}  |  Review: ${reviewLabel}`,
            marginX,
            curY
        );
        curY += 2;

        // Build table body rows
        // We flatten observations so each obs gets its own row, with the weld
        // description, spot no, and film size spanning multiple rows.
        const tableBody = [];

        rows.forEach((row, rIdx) => {
            const vData = (vDataMap && vDataMap[rIdx]) || {
                spotNo: '',
                filmSize: '',
                observations: [],
                remark: '',
            };

            // Accumulate film-size totals
            if (vData.filmSize && vData.filmSize.trim()) {
                const size = vData.filmSize.trim();
                const spots = parseInt(vData.spotNo) || 0;
                filmSizeTotals[size] = (filmSizeTotals[size] || 0) + spots;
                totalSpotsAll += spots;
            }

            const obsArr = vData.observations || [];
            const remark = vData.remark !== undefined ? vData.remark : row.remark || '';

            if (obsArr.length === 0) {
                tableBody.push([
                    { content: row.jobWeldDescription || '—', styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
                    { content: vData.spotNo || '—', styles: { halign: 'center' } },
                    { content: vData.filmSize || '—', styles: { halign: 'center' } },
                    { content: '—', styles: { halign: 'center', textColor: [148, 163, 184] } },
                    { content: '—', styles: { halign: 'center', textColor: [148, 163, 184] } },
                    { content: '—', styles: { halign: 'center', textColor: [148, 163, 184] } },
                    { content: '—', styles: { halign: 'center', textColor: [148, 163, 184] } },
                    remark || '—',
                ]);
            } else {
                obsArr.forEach((obs, oIdx) => {
                    const rowData = [];
                    if (oIdx === 0) {
                        rowData.push({
                            content: row.jobWeldDescription || '—',
                            rowSpan: obsArr.length,
                            styles: { fontStyle: 'bold', textColor: [30, 58, 138], valign: 'middle' },
                        });
                        rowData.push({
                            content: vData.spotNo || '—',
                            rowSpan: obsArr.length,
                            styles: { halign: 'center', valign: 'middle' },
                        });
                        rowData.push({
                            content: vData.filmSize || '—',
                            rowSpan: obsArr.length,
                            styles: { halign: 'center', valign: 'middle' },
                        });
                    }
                    // Vendor observation label + value
                    rowData.push({ content: obs.label || '—', styles: { halign: 'center', fillColor: [241, 245, 249] } });
                    rowData.push({ content: obs.value || '—', styles: { halign: 'center', fontStyle: 'bold' } });
                    // Company observation label + value
                    rowData.push({ content: obs.label || '—', styles: { halign: 'center', fillColor: [241, 245, 249] } });
                    rowData.push({ content: obs.companyValue || '—', styles: { halign: 'center', fontStyle: 'bold' } });
                    if (oIdx === 0) {
                        rowData.push({
                            content: remark || '—',
                            rowSpan: obsArr.length,
                            styles: { valign: 'top' },
                        });
                    }
                    tableBody.push(rowData);
                });
            }
        });

        // Draw the autotable
        autoTable(doc, {
            startY: curY,
            margin: { left: marginX, right: marginX },
            theme: 'grid',
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [30, 41, 59],
                fontStyle: 'bold',
                fontSize: 8,
                lineWidth: 0.2,
                lineColor: [148, 163, 184],
                halign: 'center',
                valign: 'middle',
                cellPadding: 2,
            },
            bodyStyles: {
                fontSize: 8,
                lineWidth: 0.2,
                lineColor: [148, 163, 184],
                textColor: [30, 41, 59],
                cellPadding: 2,
            },
            columnStyles: {
                0: { cellWidth: contentW * 0.18 }, // Weld Description
                1: { cellWidth: 16 },              // Spot No
                2: { cellWidth: 20 },              // Film Size
                3: { cellWidth: 14 },              // V-Obs Label
                4: { cellWidth: 24 },              // V-Obs Value
                5: { cellWidth: 14 },              // C-Obs Label
                6: { cellWidth: 24 },              // C-Obs Value
                7: { cellWidth: 'auto' },           // Remarks
            },
            head: [
                [
                    { content: 'WELD IDENTIFICATION', styles: { halign: 'left' } },
                    'SPOT NO',
                    'FILM SIZE',
                    { content: 'VENDOR OBSERVATION', colSpan: 2 },
                    { content: 'COMPANY OBSERVATION', colSpan: 2 },
                    'REMARKS',
                ],
            ],
            body: tableBody,
            didDrawPage: (data) => {
                // Footer on each page
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
                    pageW / 2,
                    doc.internal.pageSize.getHeight() - 5,
                    { align: 'center' }
                );
            },
        });

        curY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 4 : curY + 10;
    });

    // ========================================================
    // 4. FILM SIZE SUMMARY
    // ========================================================
    const filmSizes = Object.entries(filmSizeTotals);
    if (filmSizes.length > 0) {
        if (curY > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            curY = 12;
        }

        curY += 2;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Film Size Summary', marginX, curY);
        curY += 2;

        const summaryBody = filmSizes.map(([size, total]) => [
            { content: size, styles: { fontStyle: 'bold' } },
            { content: String(total), styles: { halign: 'center', fontStyle: 'bold' } },
        ]);
        summaryBody.push([
            { content: 'Grand Total', styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
            { content: String(totalSpotsAll), styles: { fontStyle: 'bold', halign: 'center', fillColor: [219, 234, 254], textColor: [30, 58, 138] } },
        ]);

        autoTable(doc, {
            startY: curY,
            margin: { left: marginX, right: marginX },
            theme: 'grid',
            tableWidth: contentW * 0.4,
            headStyles: {
                fillColor: [219, 234, 254],
                textColor: [30, 41, 59],
                fontStyle: 'bold',
                fontSize: 9,
                lineWidth: 0.2,
                lineColor: [148, 163, 184],
            },
            bodyStyles: {
                fontSize: 9,
                lineWidth: 0.2,
                lineColor: [148, 163, 184],
                textColor: [30, 41, 59],
            },
            head: [['Film Size', 'Total Spot No.']],
            body: summaryBody,
        });
    }

    // ========================================================
    // 5. SAVE
    // ========================================================
    const fileName = `Completed_${fd.jobNo || 'sheet'}_RS${fd.rsNo || 'N'}_${vendorName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
}
