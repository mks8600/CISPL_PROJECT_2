import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Download, Calendar } from 'lucide-react';

const ASSIGNED_KEY = 'crystal_assigned_sheets';

function getAssignments() {
    try {
        const saved = localStorage.getItem(ASSIGNED_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

// Reuse the collection logic to find completed sections
function collectAllSections(assignmentId, allAssignments) {
    const result = [];
    const seenSerials = new Set();

    function traverse(currentId) {
        const assignment = allAssignments.find((a) => a.id === currentId);
        if (!assignment) return;

        const sections = assignment.sheet.sections || [];
        const sectionStatuses = assignment.sectionStatuses || sections.map(() => 'pending');
        const reviewStatuses = assignment.reviewStatuses || sections.map(() => null);

        sections.forEach((section, idx) => {
            if (sectionStatuses[idx] === 'reassigned') {
                return;
            }
            if (section.serialNo && !seenSerials.has(section.serialNo)) {
                seenSerials.add(section.serialNo);
                result.push({ 
                    section, 
                    reviewStatus: reviewStatuses[idx],
                    vDataMap: assignment.vendorData ? assignment.vendorData[idx] : null
                });
            }
        });

        const children = allAssignments.filter((a) => a.reassignedFrom === currentId);
        for (const child of children) {
            traverse(child.id);
        }
    }

    traverse(assignmentId);
    return result;
}

function isChainFullyComplete(assignmentId, allAssignments) {
    const assignment = allAssignments.find((a) => a.id === assignmentId);
    if (!assignment) return false;
    
    // The total expected sections is the number of sections on the original root sheet
    const expectedLength = (assignment.sheet.sections || []).length;
    
    const resolved = collectAllSections(assignmentId, allAssignments);
    if (resolved.length !== expectedLength) return false;
    
    return resolved.every((r) => r.reviewStatus === 'ok');
}

export default function CompanyBillingPage() {
    const { user } = useAuth();
    const [allCompletedSheets, setAllCompletedSheets] = useState([]);
    
    // Filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('all');
    const [selectedJobNo, setSelectedJobNo] = useState('all');

    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.companyId]);

    const loadData = () => {
        const all = getAssignments().filter(a => a.companyId === user?.companyId);

        // Find "root" assignments that are fully complete
        const completed = [];
        const rootAssignments = all.filter((a) => !a.reassignedFrom && a.status === 'accepted' && a.submitted);

        for (const root of rootAssignments) {
            if (isChainFullyComplete(root.id, all)) {
                const allSections = collectAllSections(root.id, all);
                completed.push({
                    ...root,
                    resolvedSections: allSections,
                });
            }
        }
        setAllCompletedSheets(completed);
    };

    // Extract unique vendors for the filter dropdown
    const uniqueVendors = useMemo(() => {
        const vendorMap = new Map();
        allCompletedSheets.forEach(s => {
            if (s.vendorId && s.vendorName) {
                vendorMap.set(s.vendorId, s.vendorName);
            }
        });
        return Array.from(vendorMap.entries()).map(([id, name]) => ({ id, name }));
    }, [allCompletedSheets]);

    // Extract unique Job Numbers for the filter dropdown
    const uniqueJobNos = useMemo(() => {
        const jobSet = new Set();
        allCompletedSheets.forEach(s => {
            const jobNo = s.sheet?.formData?.jobNo;
            if (jobNo) jobSet.add(jobNo);
        });
        return Array.from(jobSet).sort();
    }, [allCompletedSheets]);

    // Derived state: calculate billing summaries based on the selected filters
    const billingData = useMemo(() => {
        // Filter by date, vendor, and job no first
        const filteredSheets = allCompletedSheets.filter(assignment => {
            const sheetDate = assignment.sheet?.formData?.date;
            if (!sheetDate) return false; // Incomplete sheet data
            
            // Basic string comparison works for standard YYYY-MM-DD
            if (startDate && sheetDate < startDate) return false;
            if (endDate && sheetDate > endDate) return false;
            if (selectedVendor !== 'all' && assignment.vendorId !== selectedVendor) return false;
            if (selectedJobNo !== 'all' && assignment.sheet?.formData?.jobNo !== selectedJobNo) return false;

            return true;
        });

        // Now aggregate spot numbers by film size 
        const filmSizeTotals = {};
        let totalSpotsAll = 0;

        filteredSheets.forEach(assignment => {
            const allSections = assignment.resolvedSections || [];
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
        });

        return {
            filmSizeTotals,
            totalSpotsAll,
            sheetCount: filteredSheets.length
        };
    }, [allCompletedSheets, startDate, endDate]);

    const exportToCSV = () => {
        let csv = 'Film Size,Total Spot No.\n';
        Object.entries(billingData.filmSizeTotals).forEach(([size, total]) => {
            csv += `"${size}","${total}"\n`;
        });
        csv += `"Grand Total","${billingData.totalSpotsAll}"\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateRangeStr = startDate || endDate ? `_from_${startDate || 'start'}_to_${endDate || 'end'}` : '';
        link.download = `billing_summary${dateRangeStr}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Billing Summary</h1>
                </div>
                <p className="text-slate-500">Calculate total spot numbers grouped by film size across completed sheets.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filter Data</CardTitle>
                    <CardDescription>Select a date range to filter the completed sheets calculated in the summary.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1 relative">
                            <Label htmlFor="startDate">From Date (Job Date)</Label>
                            <div className="relative">
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1 relative">
                            <Label htmlFor="endDate">To Date (Job Date)</Label>
                            <div className="relative">
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="vendor">Vendor</Label>
                            <select
                                id="vendor"
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">All Vendors</option>
                                {uniqueVendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="jobNo">Job No.</Label>
                            <select
                                id="jobNo"
                                value={selectedJobNo}
                                onChange={(e) => setSelectedJobNo(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">All Jobs</option>
                                {uniqueJobNos.map(job => (
                                    <option key={job} value={job}>{job}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-none">
                            <Button 
                                variant="outline" 
                                onClick={() => { setStartDate(''); setEndDate(''); setSelectedVendor('all'); setSelectedJobNo('all'); }}
                                className="w-full md:w-auto"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <CardTitle className="text-xl">Film Size Calculations</CardTitle>
                        <CardDescription className="mt-1">
                            Based on {billingData.sheetCount} completed sheet{billingData.sheetCount === 1 ? '' : 's'} in the selected range.
                        </CardDescription>
                    </div>
                    {Object.keys(billingData.filmSizeTotals).length > 0 && (
                        <div className="flex gap-2">
                            <Button 
                                onClick={exportToCSV}
                                variant="outline" 
                                className="shrink-0 flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                            >
                                <Download className="h-4 w-4" />
                                Export Excel
                            </Button>
                            <Button 
                                onClick={() => window.print()}
                                variant="outline" 
                                className="shrink-0 flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                            >
                                <Calculator className="h-4 w-4" />
                                Print Report
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pt-6">
                    {Object.keys(billingData.filmSizeTotals).length === 0 ? (
                        <div className="py-12 text-center text-slate-500 bg-slate-50 rounded border border-dashed">
                            <Calculator className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-medium">No billing data found.</p>
                            <p className="text-sm mt-1">Try adjusting your date filters or complete more jobs.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse border border-slate-400 text-sm">
                            <thead>
                                <tr>
                                    <th className="border border-slate-400 px-4 py-3 bg-blue-50 text-slate-700 text-left w-1/2 shadow-sm font-medium text-base">Film Size</th>
                                    <th className="border border-slate-400 px-4 py-3 bg-blue-50 text-slate-700 text-right shadow-sm font-medium text-base">Total Spot No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(billingData.filmSizeTotals).map(([size, total]) => (
                                    <tr key={size} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                                        <td className="border-r border-slate-400 px-4 py-3 bg-white font-medium text-slate-700 text-base">{size}</td>
                                        <td className="border border-slate-400 px-4 py-3 bg-white font-bold text-slate-900 text-right text-base">{total}</td>
                                    </tr>
                                ))}
                                <tr className="border-t-2 border-slate-400">
                                    <td className="border-r border-slate-400 px-4 py-3 bg-slate-100 font-bold text-slate-800 text-right text-base">Grand Total:</td>
                                    <td className="border border-slate-400 px-4 py-3 bg-blue-100 font-bold text-blue-900 text-right text-xl">{billingData.totalSpotsAll}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
