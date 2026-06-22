import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, CheckCircle2, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

import { assignmentsApi } from '@/lib/api/client';
import { exportAssignmentPdf } from '@/lib/exportPdf';

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

export default function CompanyCompletedWorkPage() {
    const { user } = useAuth();
    const [completedItems, setCompletedItems] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('all');
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [activeSearchField, setActiveSearchField] = useState('all');

    const handleSearch = () => {
        setActiveSearchQuery(searchQuery);
        setActiveSearchField(searchField);
    };

    const handleClear = () => {
        setSearchQuery('');
        setActiveSearchQuery('');
    };

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
                const obsStr = (vData.observations || []).map(o => `${o.label}: Vendor=${o.value||'N/A'}, Co=${o.companyValue||'N/A'}`).join(' | ');
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

            const completed = all.filter(a => {
                if (a.status !== 'accepted' || !a.submitted) return false;
                
                const sheetData = a.sheet_data || a.sheet || {};
                const sections = sheetData.sections || [];
                const sectionStatuses = a.section_statuses || a.sectionStatuses || sections.map(() => 'pending');
                const reviewStatuses = a.review_statuses || a.reviewStatuses || sections.map(() => null);
                
                const activeIndices = [];
                for (let i = 0; i < sections.length; i++) {
                    if (sectionStatuses[i] !== 'reassigned') activeIndices.push(i);
                }
                
                if (activeIndices.length === 0) return false; // Husk
                
                // Must have all active sections fully reviewed as OK, R/S, or Repair
                const allReviewed = activeIndices.every(i => {
                    const rs = reviewStatuses[i];
                    return rs === 'ok' || rs === 'r/s' || rs === 'repair';
                });
                
                return allReviewed;
            });
            
            const formattedCompleted = completed.map(a => {
                const sheetData = a.sheet_data || a.sheet || {};
                const sections = sheetData.sections || [];
                const sectionStatuses = a.section_statuses || a.sectionStatuses || sections.map(() => 'pending');
                const reviewStatuses = a.review_statuses || a.reviewStatuses || sections.map(() => null);
                const vDataArr = a.vendor_data || a.vendorData;
                
                const resolvedSections = [];
                for (let i = 0; i < sections.length; i++) {
                    if (sectionStatuses[i] !== 'reassigned') {
                        resolvedSections.push({
                            section: sections[i],
                            reviewStatus: reviewStatuses[i],
                            vDataMap: vDataArr ? vDataArr[i] : null
                        });
                    }
                }
                
                return {
                    ...a,
                    resolvedSections
                };
            });
            
            setCompletedItems(formattedCompleted);
        } catch (err) {
            console.error('Failed to load completed assignments', err);
            toast.error('Failed to load completed assignments. Please refresh the page.');
        }
    };

    const filteredItems = completedItems.filter(item => {
        if (!activeSearchQuery.trim()) return true;
        const query = activeSearchQuery.toLowerCase().trim();
        const sheetData = item.sheet_data || item.sheet || {};
        const fd = sheetData.form_data || sheetData.formData || {};
        
        const rsNo = String(fd.rsNo || '').toLowerCase();
        const jobNo = String(fd.jobNo || '').toLowerCase();
        const rawDate = String(fd.date || '').toLowerCase();
        const displayDate = String(formatDate(fd.date) || '').toLowerCase();
        const vendorName = String(item.vendor_name || item.vendorName || '').toLowerCase();

        if (activeSearchField === 'rsNo') {
            return rsNo.includes(query);
        }
        if (activeSearchField === 'date') {
            return rawDate.includes(query) || displayDate.includes(query);
        }
        if (activeSearchField === 'vendor') {
            return vendorName.includes(query);
        }
        
        return rsNo.includes(query) || 
               jobNo.includes(query) || 
               rawDate.includes(query) || 
               displayDate.includes(query) ||
               vendorName.includes(query);
    });

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

            {/* Search Controls */}
            {completedItems.length > 0 && (
                <Card className="print:hidden">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={searchField} onValueChange={setSearchField}>
                                <SelectTrigger className="w-full sm:w-40 h-10">
                                    <SelectValue placeholder="Search by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Search All</SelectItem>
                                    <SelectItem value="rsNo">RS No.</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="vendor">Vendor</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder={
                                        searchField === 'rsNo' ? "Search by RS No. (e.g. 12)..." :
                                        searchField === 'date' ? "Search by Date (e.g. 01 Jun 2026)..." :
                                        searchField === 'vendor' ? "Search by Vendor Name..." :
                                        "Search by RS No., Date, Vendor..."
                                    }
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    className="pl-10 pr-10 h-10 w-full"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={handleClear}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <Button onClick={handleSearch} className="h-10 bg-green-600 hover:bg-green-700 text-white gap-2 px-5">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
            ) : filteredItems.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <Search className="h-12 w-12 mx-auto text-slate-300 mb-3 animate-pulse" />
                            <p className="font-semibold text-slate-600">No matching completed works found.</p>
                            <p className="text-sm mt-1 text-slate-400">Try refining your search terms for RS No., Date, or Job No.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Results count */}
                    <div className="flex items-center justify-between px-1">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{filteredItems.length}</span> completed {filteredItems.length === 1 ? 'sheet' : 'sheets'}
                            {activeSearchQuery && <span className="ml-1 text-slate-400">for "{activeSearchQuery}"</span>}
                        </p>
                        <p className="text-xs text-slate-400">Scroll to view all</p>
                    </div>

                    {/* Scrollable container */}
                    <div
                        className="border border-slate-200 rounded-xl bg-white/50 shadow-sm print:border-0 print:shadow-none print:bg-transparent print:max-h-none print:overflow-visible"
                        style={{
                            maxHeight: '70vh',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#94a3b8 transparent',
                        }}
                    >
                    <div className="space-y-4 p-4 print:p-0">
                    {filteredItems.map((assignment) => {
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
                                        {(() => {
                                            const hasRepair = allSections.some(s => s.reviewStatus === 'repair');
                                            const hasRS = allSections.some(s => s.reviewStatus === 'r/s');
                                            if (hasRepair || hasRS) {
                                                const parts = [];
                                                if (hasRepair) parts.push('Repair');
                                                if (hasRS) parts.push('R/S');
                                                return (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                        <CheckCircle2 className="h-3 w-3" /> Reviewed ({parts.join(' & ')})
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle2 className="h-3 w-3" /> All Reviewed OK
                                                </span>
                                            );
                                        })()}
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
                                                    onClick={() => exportAssignmentPdf(assignment)}
                                                    variant="outline" 
                                                    className="print:hidden shrink-0 flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                                                >
                                                    <Download className="h-4 w-4" />
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
                                                                        <td rowSpan={obsCount} className="border-r border-slate-400 px-2 py-1.5 font-semibold text-blue-900 bg-blue-50/50 break-all whitespace-pre-wrap min-w-[150px] max-w-[200px] border-l-4 border-l-blue-500">
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
                    </div>
                </>
            )}
        </div>
    );
}
