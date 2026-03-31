import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Activity, ChevronDown, ChevronUp, CheckCircle2, CircleDot, RotateCcw, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const ASSIGNED_KEY = 'crystal_assigned_sheets';

function getAssignments() {
    try {
        const saved = localStorage.getItem(ASSIGNED_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

export default function CompanyOrderStatusPage() {
    const [assignments, setAssignments] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [descriptions, setDescriptions] = useState({});

    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const loadData = () => {
        const all = getAssignments();

        // Auto-fix legacy data: if a sheet is submitted, any 'pending' sections should be 'complete'
        let dataChanged = false;
        const autoFixedAll = all.map(a => {
            if (a.submitted && a.status === 'accepted') {
                const sectionStatuses = a.sectionStatuses ? [...a.sectionStatuses] : (a.sheet.sections || []).map(() => 'pending');
                let changed = false;
                const newStatuses = sectionStatuses.map(s => {
                    if (s === 'pending') {
                        changed = true;
                        return 'complete';
                    }
                    return s;
                });
                if (changed) {
                    dataChanged = true;
                    return { ...a, sectionStatuses: newStatuses };
                }
            }
            return a;
        });

        if (dataChanged) {
            localStorage.setItem(ASSIGNED_KEY, JSON.stringify(autoFixedAll));
        }

        const validAll = dataChanged ? autoFixedAll : all;

        const readyForReview = validAll.filter((a) => {
            if (a.status !== 'accepted' || !a.submitted) return false;
            const sections = a.sheet.sections || [];
            if (sections.length === 0) return false;
            const sectionStatuses = a.sectionStatuses || sections.map(() => 'pending');
            const reviewStatuses = a.reviewStatuses || sections.map(() => null);
            // Check non-reassigned sections only
            const activeIndices = sectionStatuses.reduce((acc, s, i) => {
                if (s !== 'reassigned') acc.push(i);
                return acc;
            }, []);
            if (activeIndices.length === 0) return false;
            // Exclude if all active sections are reviewed as OK
            const allActiveOk = activeIndices.every((i) => reviewStatuses[i] === 'ok');
            if (allActiveOk) return false;
            // Must have at least one complete section to review (pending ones go to Pending Work)
            const hasCompleteSectionToReview = activeIndices.some((i) => sectionStatuses[i] === 'complete');
            if (!hasCompleteSectionToReview) return false;
            return true;
        });
        setAssignments(readyForReview);
    };

    const handleCompanyObservationValue = (assignmentId, sIdx, rIdx, obsIdx, value) => {
        const all = getAssignments();
        const updated = all.map((a) => {
            if (a.id === assignmentId) {
                const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                if (!newVendorData[sIdx]) newVendorData[sIdx] = {};
                if (!newVendorData[sIdx][rIdx]) newVendorData[sIdx][rIdx] = { observations: [] };
                if (!newVendorData[sIdx][rIdx].observations[obsIdx]) {
                    newVendorData[sIdx][rIdx].observations[obsIdx] = { label: '', value: '' };
                }
                newVendorData[sIdx][rIdx].observations[obsIdx].companyValue = value;
                return { ...a, vendorData: newVendorData };
            }
            return a;
        });
        localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));
        setAssignments(prev => prev.map(a => a.id === assignmentId ? updated.find(u => u.id === assignmentId) : a));
    };

    const handleReview = (assignmentId, sectionIndex, reviewStatus) => {
        const descKey = `${assignmentId}-${sectionIndex}`;
        const description = descriptions[descKey] || '';

        if ((reviewStatus === 'retake' || reviewStatus === 'repair') && !description.trim()) {
            toast.error('Please enter a description for Retake/Repair.');
            return;
        }

        const all = getAssignments();
        const updated = all.map((a) => {
            if (a.id === assignmentId) {
                const reviewStatuses = a.reviewStatuses ? [...a.reviewStatuses] : (a.sheet.sections || []).map(() => null);
                const reviewDescriptions = a.reviewDescriptions ? [...a.reviewDescriptions] : (a.sheet.sections || []).map(() => '');
                reviewStatuses[sectionIndex] = reviewStatus;
                reviewDescriptions[sectionIndex] = reviewStatus === 'ok' ? '' : description.trim();
                return { ...a, reviewStatuses, reviewDescriptions };
            }
            return a;
        });
        localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));
        loadData();
        setDescriptions((prev) => ({ ...prev, [descKey]: '' }));
        toast.success(`Section marked as ${reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1)}!`);
    };

    const getReviewBadge = (status) => {
        if (status === 'ok') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3" /> OK
            </span>
        );
        if (status === 'retake') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <RotateCcw className="h-3 w-3" /> Retake
            </span>
        );
        if (status === 'repair') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Wrench className="h-3 w-3" /> Repair
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                <CircleDot className="h-3 w-3" /> Not Reviewed
            </span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-900">Order Status</h1>
                </div>
                <p className="text-slate-500">Review submitted sections — mark as OK, Retake, or Repair</p>
            </div>

            {/* Orders */}
            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <Activity className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-medium">No submitted orders to review.</p>
                            <p className="text-sm mt-1">Submitted orders will appear here for review.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => {
                        const fd = assignment.sheet.formData;
                        const isExpanded = expandedId === assignment.id;
                        const sections = assignment.sheet.sections || [];
                        const sectionStatuses = assignment.sectionStatuses || sections.map(() => 'pending');
                        const reviewStatuses = assignment.reviewStatuses || sections.map(() => null);
                        const reviewDescriptions = assignment.reviewDescriptions || sections.map(() => '');
                        // Only count complete sections (pending ones go to Pending Work page)
                        const completeSectionCount = sectionStatuses.filter((s) => s === 'complete').length;
                        const reviewedCount = sectionStatuses.reduce((count, s, i) => {
                            if (s === 'complete' && reviewStatuses[i] !== null) return count + 1;
                            return count;
                        }, 0);

                        return (
                            <Card key={assignment.id} className="overflow-hidden">
                                {/* Summary Row */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded flex items-center justify-center ${reviewedCount === completeSectionCount && completeSectionCount > 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {reviewedCount === completeSectionCount && completeSectionCount > 0 ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {fd.jobNo}
                                                <span className="font-normal text-slate-500 ml-2">— {formatDate(fd.date)}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Vendor: <span className="font-medium text-slate-700">{assignment.vendorName}</span> ({assignment.vendorNo})
                                                {fd.rsNo && <span className="ml-2">• RS: {fd.rsNo}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {completeSectionCount > 0 && (
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {reviewedCount}/{completeSectionCount} Reviewed
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Section Review */}
                                {isExpanded && (
                                    <div className="border-t px-4 py-4">
                                        {/* Sheet Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4 p-3 bg-slate-50 rounded-lg">
                                            <div><span className="text-slate-500">Job No:</span> <span className="font-medium">{fd.jobNo}</span></div>
                                            <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(fd.date)}</span></div>
                                            <div><span className="text-slate-500">RS No:</span> <span className="font-medium">{fd.rsNo || '—'}</span></div>
                                        </div>

                                        {/* Sections */}
                                        {sections.length === 0 ? (
                                            <p className="text-sm text-slate-400">No sections in this sheet.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {sections.map((section, sIdx) => {
                                                    const sStatus = sectionStatuses[sIdx] || 'pending';
                                                    // Skip pending and reassigned sections — they don't belong here
                                                    if (sStatus === 'pending' || sStatus === 'reassigned') return null;
                                                    const rStatus = reviewStatuses[sIdx];
                                                    const rDesc = reviewDescriptions[sIdx] || '';
                                                    const descKey = `${assignment.id}-${sIdx}`;

                                                    return (
                                                        <div key={sIdx} className="border rounded-lg overflow-hidden">
                                                            {/* Section Header */}
                                                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-semibold text-slate-700">#{sIdx + 1}</span>
                                                                    <span className="text-sm font-medium text-slate-800">Serial No: {section.serialNo || '—'}</span>
                                                                    <span className="text-xs text-slate-500">({section.rows.map(row => row.spotNos).join(', ') || '—'})</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {sStatus === 'complete' ? (
                                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Vendor: Complete</span>
                                                                    ) : (
                                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Vendor: Pending</span>
                                                                    )}
                                                                    {getReviewBadge(rStatus)}
                                                                </div>
                                                            </div>

                                                            {/* Section Data Table */}
                                                            <table className="w-full border-collapse border-y border-slate-400 text-sm">
                                                                <thead>
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
                                                                    {section.rows.map((row, rIdx) => {
                                                                        const vData = (assignment.vendorData && assignment.vendorData[sIdx] && assignment.vendorData[sIdx][rIdx]) || { spotNo: '', filmSize: '', observations: [], remark: '' };
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
                                                                                    
                                                                                    {vData.observations.length > 0 ? (
                                                                                        <>
                                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">{vData.observations[0].label}</td>
                                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center w-24 bg-white font-bold text-slate-900 border-b border-slate-200">
                                                                                                {vData.observations[0].value || '—'}
                                                                                                {vData.observations[0].status === 'complete' && <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-500" />}
                                                                                            </td>
                                                                                            <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">
                                                                                                {vData.observations[0].label}
                                                                                            </td>
                                                                                            <td className="border-r border-slate-400 p-0 align-top bg-white w-28 border-b border-slate-200">
                                                                                                <Select
                                                                                                    value={vData.observations[0].companyValue || ''}
                                                                                                    onValueChange={val => handleCompanyObservationValue(assignment.id, sIdx, rIdx, 0, val)}
                                                                                                >
                                                                                                    <SelectTrigger className="w-full h-full min-h-[32px] border-0 rounded-none shadow-none focus:ring-0 px-1 text-center justify-center font-medium bg-transparent overflow-hidden text-xs">
                                                                                                        <SelectValue placeholder="—" />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="OK">OK</SelectItem>
                                                                                                        <SelectItem value="R/S">R/S</SelectItem>
                                                                                                        <SelectItem value="Repair">Repair</SelectItem>
                                                                                                        <SelectItem value="Missing">Missing</SelectItem>
                                                                                                    </SelectContent>
                                                                                                </Select>
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
                                                                                            <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-28 text-slate-400 text-xs">N/A</td>
                                                                                            <td rowSpan={obsCount} className="p-2 text-slate-500 whitespace-pre-wrap align-top bg-white w-48 italic text-xs">
                                                                                                {vData.remark !== undefined ? vData.remark : (row.remark || '—')}
                                                                                            </td>
                                                                                        </>
                                                                                    )}
                                                                                </tr>
                                                                                
                                                                                {vData.observations.slice(1).map((obs, offsetIdx) => (
                                                                                    <tr key={offsetIdx + 1} className="border-b border-slate-200 last:border-b-0">
                                                                                        <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">{obs.label}</td>
                                                                                        <td className="border-r border-slate-400 px-2 py-1.5 text-center w-24 bg-white font-bold text-slate-900 border-b border-slate-200">
                                                                                            {obs.value || '—'}
                                                                                            {obs.status === 'complete' && <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-500" />}
                                                                                        </td>
                                                                                        {/* Mirror Vendor structure in slice(1) mapping */}
                                                                                        <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium border-b border-slate-200">
                                                                                            {obs.label}
                                                                                        </td>
                                                                                        <td className="border-r border-slate-400 p-0 align-top bg-white w-28 border-b border-slate-200">
                                                                                            <Select
                                                                                                value={obs.companyValue || ''}
                                                                                                onValueChange={val => handleCompanyObservationValue(assignment.id, sIdx, rIdx, offsetIdx + 1, val)}
                                                                                            >
                                                                                                <SelectTrigger className="w-full h-full min-h-[32px] border-0 rounded-none shadow-none focus:ring-0 px-1 text-center justify-center font-medium bg-transparent overflow-hidden text-xs">
                                                                                                    <SelectValue placeholder="—" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    <SelectItem value="OK">OK</SelectItem>
                                                                                                    <SelectItem value="R/S">R/S</SelectItem>
                                                                                                    <SelectItem value="Repair">Repair</SelectItem>
                                                                                                    <SelectItem value="Missing">Missing</SelectItem>
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </React.Fragment>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>

                                                            {/* Review Actions */}
                                                            {rStatus ? (
                                                                <div className={`px-4 py-3 text-sm ${rStatus === 'ok' ? 'bg-green-50' : rStatus === 'retake' ? 'bg-orange-50' : 'bg-red-50'}`}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            {getReviewBadge(rStatus)}
                                                                            {rDesc && <span className="text-slate-600 ml-1">— {rDesc}</span>}
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleReview(assignment.id, sIdx, null)}
                                                                            className="text-xs text-slate-500 hover:text-slate-700 h-7"
                                                                        >
                                                                            Change
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="px-4 py-3 bg-slate-50 border-t space-y-3">
                                                                    {/* Description input */}
                                                                    <div className="space-y-1">
                                                                        <label className="text-xs font-medium text-slate-600">Description (required for Retake / Repair)</label>
                                                                        <Input
                                                                            value={descriptions[descKey] || ''}
                                                                            onChange={(e) => setDescriptions((prev) => ({ ...prev, [descKey]: e.target.value }))}
                                                                            placeholder="Enter reason for retake or repair..."
                                                                            className="h-8 text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleReview(assignment.id, sIdx, 'ok')}
                                                                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 gap-1"
                                                                        >
                                                                            <CheckCircle2 className="h-3.5 w-3.5" /> OK
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleReview(assignment.id, sIdx, 'retake')}
                                                                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1"
                                                                        >
                                                                            <RotateCcw className="h-3.5 w-3.5" /> Retake
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleReview(assignment.id, sIdx, 'repair')}
                                                                            className="bg-red-500 hover:bg-red-600 text-white text-xs h-8 gap-1"
                                                                        >
                                                                            <Wrench className="h-3.5 w-3.5" /> Repair
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
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
