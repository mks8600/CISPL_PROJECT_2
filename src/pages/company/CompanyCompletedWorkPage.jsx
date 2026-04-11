import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle2, Printer, Download } from 'lucide-react';

import { assignmentsApi } from '@/lib/api/client';

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

/**
 * Collect all resolved sections for an assignment, including sections
 * that were reassigned and completed in child assignments.
 * Returns an array of { section, reviewStatus } for all fully-resolved sections.
 * Deduplicates by serialNo to handle complex reassignment chains.
 */
function collectAllSections(assignmentId, allAssignments) {
    const result = [];
    const seenSerials = new Set();

    function traverse(currentId) {
        const assignment = allAssignments.find((a) => a.id === currentId);
        if (!assignment) return;

        const sheetData = assignment.sheet_data || assignment.sheet || {};
        const sections = sheetData.sections || [];
        const sectionStatuses = assignment.section_statuses || assignment.sectionStatuses || sections.map(() => 'pending');
        const reviewStatuses = assignment.review_statuses || assignment.reviewStatuses || sections.map(() => null);

        sections.forEach((section, idx) => {
            if (sectionStatuses[idx] === 'reassigned') {
                return; // Skip, will get it from child
            }
            // Only add if we haven't seen this serial number yet
            if (section.serialNo && !seenSerials.has(section.serialNo)) {
                seenSerials.add(section.serialNo);
                const vDataArr = assignment.vendor_data || assignment.vendorData;
                result.push({ 
                    section, 
                    reviewStatus: reviewStatuses[idx],
                    vDataMap: vDataArr ? vDataArr[idx] : null
                });
            }
        });

        // Traverse children
        const children = allAssignments.filter((a) => a.reassigned_from === currentId || a.reassignedFrom === currentId);
        for (const child of children) {
            traverse(child.id);
        }
    }

    traverse(assignmentId);
    
    // Sort by serial number so they appear in order (e.g., 1, 2, 3)
    return result.sort((a, b) => {
        const numA = parseInt(a.section.serialNo) || 0;
        const numB = parseInt(b.section.serialNo) || 0;
        return numA - numB;
    });
}

/**
 * Check if an entire assignment chain (original + all descendants) is fully complete.
 * All sections across all assignments must be complete + reviewed OK.
 */
function isChainFullyComplete(assignmentId, allAssignments) {
    const assignment = allAssignments.find((a) => a.id === assignmentId);
    if (!assignment) return false;
    
    // The total expected sections is the number of sections on the original root sheet
    const sheetData = assignment.sheet_data || assignment.sheet || {};
    const expectedLength = (sheetData.sections || []).length;
    
    const resolved = collectAllSections(assignmentId, allAssignments);
    if (resolved.length !== expectedLength) return false;
    
    return resolved.every((r) => r.reviewStatus === 'ok');
}

export default function CompanyCompletedWorkPage() {
    const { user } = useAuth();
    const [completedItems, setCompletedItems] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.companyId]);

    const exportToCSV = (assignment) => {
        const sheetData = assignment.sheet_data || assignment.sheet || {};
        const fd = sheetData.form_data || sheetData.formData || {};
        const allSections = assignment.resolvedSections || [];
        
        let csv = 'Job No,Date,RS No,Vendor,Serial No,Weld Description,Spot No,Film Size,Observations,Remark\n';
        
        allSections.forEach(({ section, vDataMap }) => {
            (section.rows || []).forEach((row, rIdx) => {
                const vData = vDataMap?.[rIdx] || {};
                const obsStr = (vData.observations || []).map(o => `${o.label}:${o.value||'N/A'}`).join(' | ');
                const line = [
                    `"${fd.jobNo || ''}"`,
                    `"${formatDate(fd.date)}"`,
                    `"${fd.rsNo || ''}"`,
                    `"${assignment.vendor_name || assignment.vendorName || ''}"`,
                    `"${section.serialNo || ''}"`,
                    `"${(row.jobWeldDescription || '').replace(/"/g, '""')}"`,
                    `"${vData.spotNo || ''}"`,
                    `"${vData.filmSize || ''}"`,
                    `"${obsStr}"`,
                    `"${(vData.remark || row.remark || '').replace(/"/g, '""')}"`
                ].join(',');
                csv += line + '\n';
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `completed_${fd.jobNo || 'sheet'}_${fd.rsNo || 'export'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const loadData = async () => {
        try {
            const all = await assignmentsApi.list();

            // Find "root" assignments (ones that are NOT reassigned from another)
            // that have their entire chain fully complete
            const completed = [];
            const rootAssignments = all.filter((a) => !a.reassigned_from && !a.reassignedFrom && a.status === 'accepted' && a.submitted);

        for (const root of rootAssignments) {
            if (isChainFullyComplete(root.id, all)) {
                const allSections = collectAllSections(root.id, all);
                completed.push({
                    ...root,
                    resolvedSections: allSections,
                });
            }
        }

            setCompletedItems(completed);
        } catch (err) {
            console.error('Failed to load completed assignments', err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="print:hidden">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Completed Works</h1>
                </div>
                <p className="text-slate-500">View all fully completed and reviewed sheets</p>
            </div>

            {/* Completed Items */}
            {completedItems.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <CheckCircle2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-medium">No completed works yet.</p>
                            <p className="text-sm mt-1">Sheets that are fully complete and reviewed as OK will appear here.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {completedItems.map((assignment) => {
                        const sheetData = assignment.sheet_data || assignment.sheet || {};
                        const fd = sheetData.form_data || sheetData.formData || {};
                        const isExpanded = expandedId === assignment.id;
                        const allSections = assignment.resolvedSections || [];

                        const filmSizeTotals = {};
                        let totalSpotsAll = 0;
                        allSections.forEach(item => {
                            (item.section.rows || []).forEach((row, rIdx) => {
                                const vData = item.vDataMap?.[rIdx];
                                if (vData && vData.filmSize && vData.filmSize.trim() !== '') {
                                    const size = vData.filmSize.trim();
                                    const spotCount = parseInt(vData.spotNo) || 0;
                                    filmSizeTotals[size] = (filmSizeTotals[size] || 0) + spotCount;
                                    totalSpotsAll += spotCount;
                                }
                            });
                        });

                        return (
                            <Card 
                                key={assignment.id} 
                                className={`overflow-hidden border-green-200 transition-all ${
                                    expandedId && !isExpanded ? 'print:hidden' : ''
                                } ${isExpanded ? 'print:border-0 print:shadow-none bg-transparent' : ''}`}
                            >
                                {/* Summary */}
                                <div
                                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-green-50/50 transition-colors ${isExpanded ? 'print:hidden' : ''}`}
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-green-50 flex items-center justify-center text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {fd.jobNo}
                                                <span className="font-normal text-slate-500 ml-2">— {formatDate(fd.date)}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Vendor: <span className="font-medium text-slate-700">{assignment.vendor_name || assignment.vendorName}</span> ({assignment.vendor_no || assignment.vendorNo})
                                                {fd.rsNo && <span className="ml-2">• RS: {fd.rsNo}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle2 className="h-3 w-3" /> All Reviewed OK
                                        </span>
                                        <span className="text-xs text-slate-400">{allSections.length} section(s)</span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Full Details */}
                                {isExpanded && (
                                    <div className="border-t print:border-t-0 p-0">
                                        {/* Sheet Info */}
                                        <div className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm p-4 bg-green-50 rounded-lg print:border print:border-slate-300 print:bg-white print:mb-4">
                                                <div><span className="text-slate-500">Job No:</span> <span className="font-semibold text-slate-900 ml-1">{fd.jobNo}</span></div>
                                                <div><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900 ml-1">{formatDate(fd.date)}</span></div>
                                                <div><span className="text-slate-500">Vendor:</span> <span className="font-semibold text-slate-900 ml-1">{assignment.vendor_name || assignment.vendorName}</span></div>
                                                <div><span className="text-slate-500">RS No:</span> <span className="font-semibold text-slate-900 ml-1">{fd.rsNo || '—'}</span></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    onClick={() => exportToCSV(assignment)}
                                                    variant="outline" 
                                                    className="print:hidden shrink-0 flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Export Excel
                                                </Button>
                                                <Button 
                                                    onClick={() => window.print()}
                                                    variant="outline" 
                                                    className="print:hidden shrink-0 flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                    Export PDF
                                                </Button>
                                            </div>
                                        </div>

                                        {/* All Resolved Sections */}
                                        <div className="px-4 pb-4 space-y-3">
                                            {allSections.map((item, sIdx) => (
                                                <table key={sIdx} className="w-full border-collapse border border-slate-400 text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-green-50 w-[15%]">Serial No:</th>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-left font-medium" colSpan={7}>
                                                              <div className="flex items-center justify-between">
                                                                <span>{item.section.serialNo || '—'}</span>
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    <CheckCircle2 className="h-3 w-3" /> OK
                                                                </span>
                                                              </div>
                                                            </th>
                                                        </tr>
                                                        <tr>
                                                            <th className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-left w-[25%] text-slate-700 shadow-sm">WELD IDENTIFICATION</th>
                                                            <th className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center w-16 text-slate-700 shadow-sm">SPOT NO</th>
                                                            <th className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center w-20 text-slate-700 shadow-sm">FILM SIZE</th>
                                                            <th colSpan="2" className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center text-slate-700 shadow-sm">VENDOR OBSERVATION</th>
                                                            <th colSpan="2" className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center text-slate-700 shadow-sm">COMPANY OBSERVATION</th>
                                                            <th className="border-y border-slate-400 px-2 py-1 bg-slate-100 text-left text-slate-700 shadow-sm">REMARKS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.section.rows.map((row, rIdx) => {
                                                            const vData = (item.vDataMap && item.vDataMap[rIdx]) || { spotNo: '', filmSize: '', observations: [], remark: '' };
                                                            const obsCount = Math.max(1, vData.observations.length);
                                                            
                                                            return (
                                                                <React.Fragment key={rIdx}>
                                                                    <tr className="border-b border-slate-300">
                                                                        <td rowSpan={obsCount} className="border-r border-slate-400 px-2 py-1.5 font-semibold text-blue-900 bg-blue-50/50 break-words whitespace-pre-wrap min-w-[150px] border-l-4 border-l-blue-500">
                                                                            {row.jobWeldDescription || '—'}
                                                                        </td>
                                                                        <td rowSpan={obsCount} className="border-r border-slate-400 p-2 text-center align-middle font-medium bg-slate-50">
                                                                            {vData.spotNo || '—'}
                                                                        </td>
                                                                        <td rowSpan={obsCount} className="border-r border-slate-400 p-2 text-center align-middle font-medium bg-slate-50">
                                                                            {vData.filmSize || '—'}
                                                                        </td>
                                                                        
                                                                        {vData.observations && vData.observations.length > 0 ? (
                                                                            <>
                                                                                <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">{vData.observations[0].label}</td>
                                                                                <td className="border-r border-slate-400 px-2 py-1.5 text-center w-24 bg-white font-bold text-slate-900 border-b border-slate-200">
                                                                                    {vData.observations[0].value || '—'}
                                                                                    {vData.observations[0].status === 'complete' && <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-500" />}
                                                                                </td>
                                                                                <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">{vData.observations[0].label}</td>
                                                                                <td className="border-r border-slate-400 px-2 py-1.5 text-center w-24 bg-white font-bold text-slate-900 border-b border-slate-200">
                                                                                    {vData.observations[0].companyValue || '—'}
                                                                                </td>
                                                                                <td rowSpan={obsCount} className="p-2 text-slate-700 whitespace-pre-wrap align-top bg-white w-48 font-medium">
                                                                                    {vData.remark !== undefined ? vData.remark : (row.remark || '—')}
                                                                                </td>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-12 text-slate-400 text-xs">N/A</td>
                                                                                <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-24 text-slate-400 text-xs">N/A</td>
                                                                                <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-12 text-slate-400 text-xs">N/A</td>
                                                                                <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-24 text-slate-400 text-xs">N/A</td>
                                                                                <td rowSpan={obsCount} className="p-2 text-slate-500 whitespace-pre-wrap align-top bg-white w-48 italic">
                                                                                    {vData.remark !== undefined ? vData.remark : (row.remark || '—')}
                                                                                </td>
                                                                            </>
                                                                        )}
                                                                    </tr>
                                                                    
                                                                    {(vData.observations || []).slice(1).map((obs, offsetIdx) => (
                                                                        <tr key={offsetIdx + 1} className="border-b border-slate-200 last:border-b-0">
                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">{obs.label}</td>
                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center w-24 bg-white font-bold text-slate-900 border-b border-slate-200">
                                                                                {obs.value || '—'}
                                                                                {obs.status === 'complete' && <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-500" />}
                                                                            </td>
                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">{obs.label}</td>
                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center w-24 bg-white font-bold text-slate-900 border-b border-slate-200">
                                                                                {obs.companyValue || '—'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ))}
                                        </div>

                                        {/* Film Size Summary */}
                                        {Object.keys(filmSizeTotals).length > 0 && (
                                            <div className="px-4 pb-4">
                                                <table className="w-full border-collapse border border-slate-400 text-sm mt-4">
                                                    <thead>
                                                        <tr>
                                                            <th className="border border-slate-400 px-3 py-1.5 bg-blue-50 text-slate-800 text-left font-semibold shadow-sm" colSpan={2}>
                                                                Film Size Summary
                                                            </th>
                                                        </tr>
                                                        <tr>
                                                            <th className="border border-slate-400 px-3 py-2 bg-slate-100 text-slate-700 text-left w-1/2 shadow-sm font-medium">Film Size</th>
                                                            <th className="border border-slate-400 px-3 py-2 bg-slate-100 text-slate-700 text-left shadow-sm font-medium">Total Spot No.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(filmSizeTotals).map(([size, total]) => (
                                                            <tr key={size} className="border-b border-slate-300">
                                                                <td className="border-r border-slate-400 px-3 py-2 bg-white font-medium text-slate-700">{size}</td>
                                                                <td className="border border-slate-400 px-3 py-2 bg-white font-bold text-slate-900">{total}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="border-t-2 border-slate-400">
                                                            <td className="border-r border-slate-400 px-3 py-2 bg-slate-50 font-bold text-slate-800 text-right">Grand Total:</td>
                                                            <td className="border border-slate-400 px-3 py-2 bg-blue-50/50 font-bold text-blue-900">{totalSpotsAll}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}


                                        {/* Submitted info */}
                                        {(assignment.submitted_at || assignment.submittedAt) && (
                                            <div className="border-t print:border-0 px-4 py-3 bg-green-50 print:bg-white text-sm text-green-700 print:text-slate-500 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 print:hidden" />
                                                <span className="print:italic">Submitted to Company Portal on {formatDate(assignment.submitted_at || assignment.submittedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
