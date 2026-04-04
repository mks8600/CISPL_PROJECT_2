import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ChevronDown, ChevronUp, Send, CircleDot, RotateCcw, Wrench, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ASSIGNED_KEY = 'crystal_assigned_sheets';
const VENDORS_KEY = 'crystal_vendors';

function getFromStorage(key) {
    try {
        const saved = localStorage.getItem(key);
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

export default function CompanyPendingWorkPage() {
    const { user } = useAuth();
    const [pendingItems, setPendingItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [reassignVendor, setReassignVendor] = useState({});

    const loadData = () => {
        const all = getFromStorage(ASSIGNED_KEY).filter(a => a.companyId === user?.companyId);
        setVendors(getFromStorage(VENDORS_KEY));

        // Find submitted sheets that have:
        // 1. Pending sections from vendor (not reassigned), OR
        // 2. Sections marked as retake/repair by company (not reassigned), OR
        // 3. Sections that have been reassigned (so the sheet stays visible)
        const withPending = all.filter((a) => {
            if (a.status !== 'accepted' || !a.submitted) return false;
            const statuses = a.sectionStatuses || (a.sheet.sections || []).map(() => 'pending');
            const reviewStatuses = a.reviewStatuses || (a.sheet.sections || []).map(() => null);
            return statuses.some((s, i) => {
                if (s === 'pending' || s === 'reassigned') return true;
                if (reviewStatuses[i] === 'retake' || reviewStatuses[i] === 'repair') return true;
                return false;
            });
        });
        setPendingItems(withPending);
    };

    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.companyId]);

    const handleReassign = (assignmentId) => {
        const vendorId = reassignVendor[assignmentId];
        if (!vendorId) {
            toast.error('Please select a vendor first.');
            return;
        }

        const vendor = vendors.find((v) => v.id === vendorId);
        if (!vendor) {
            toast.error('Invalid vendor.');
            return;
        }

        const all = getFromStorage(ASSIGNED_KEY);
        const original = all.find((a) => a.id === assignmentId);
        if (!original) return;

        const sectionStatuses = original.sectionStatuses || (original.sheet.sections || []).map(() => 'pending');
        const reviewStatuses = original.reviewStatuses || (original.sheet.sections || []).map(() => null);

        // Build a new sheet with pending/retake/repair sections
        const pendingSections = [];
        const pendingStatuses = [];
        (original.sheet.sections || []).forEach((section, idx) => {
            if (sectionStatuses[idx] === 'pending' ||
                reviewStatuses[idx] === 'retake' ||
                reviewStatuses[idx] === 'repair') {
                pendingSections.push(section);
                pendingStatuses.push('pending');
            }
        });

        const newAssignment = {
            id: `assign-${Date.now()}`,
            sheetId: original.sheetId,
            sheet: {
                ...original.sheet,
                sections: pendingSections,
            },
            vendorId: vendor.id,
            vendorNo: vendor.vendorNo,
            vendorName: vendor.vendorName,
            companyId: user?.companyId,
            companyName: user?.companyName,
            status: 'pending', // Always require explicit acceptance for reassigned blocks
            assignedAt: new Date().toISOString(),
            sectionStatuses: pendingStatuses,
            reassignedFrom: assignmentId,
        };

        // Mark reassigned sections in the original assignment as 'reassigned'
        const updatedOriginalStatuses = [...sectionStatuses];
        const updatedOriginalReviews = [...reviewStatuses];
        (original.sheet.sections || []).forEach((_, idx) => {
            if (sectionStatuses[idx] === 'pending' ||
                reviewStatuses[idx] === 'retake' ||
                reviewStatuses[idx] === 'repair') {
                updatedOriginalStatuses[idx] = 'reassigned';
                updatedOriginalReviews[idx] = 'reassigned';
            }
        });

        const updated = all.map((a) => {
            if (a.id === assignmentId) {
                return { ...a, sectionStatuses: updatedOriginalStatuses, reviewStatuses: updatedOriginalReviews };
            }
            return a;
        });
        updated.unshift(newAssignment);
        localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));

        setReassignVendor((prev) => ({ ...prev, [assignmentId]: '' }));
        loadData();
        toast.success(`Pending sections reassigned to ${vendor.vendorName}!`);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Pending Work</h1>
                </div>
                <p className="text-slate-500">View incomplete sections from submitted sheets and reassign to vendors</p>
            </div>

            {/* Pending Items */}
            {pendingItems.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <AlertTriangle className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-medium">No pending work found.</p>
                            <p className="text-sm mt-1">All submitted sheets are fully complete.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {pendingItems.map((assignment) => {
                        const fd = assignment.sheet.formData;
                        const isExpanded = expandedId === assignment.id;
                        const sections = assignment.sheet.sections || [];
                        const sectionStatuses = assignment.sectionStatuses || sections.map(() => 'pending');
                        const reviewStatuses = assignment.reviewStatuses || sections.map(() => null);
                        const reviewDescriptions = assignment.reviewDescriptions || sections.map(() => '');
                        const pendingCount = sections.filter((_, i) =>
                            sectionStatuses[i] !== 'reassigned' && (
                                sectionStatuses[i] === 'pending' ||
                                reviewStatuses[i] === 'retake' ||
                                reviewStatuses[i] === 'repair'
                            )
                        ).length;

                        const reassignedCount = sections.filter((_, i) => sectionStatuses[i] === 'reassigned').length;

                        const allAssigned = getFromStorage(ASSIGNED_KEY);
                        const childAssignments = allAssigned.filter(a => a.reassignedFrom === assignment.id);

                        return (
                            <Card key={assignment.id} className="overflow-hidden border-amber-200">
                                {/* Summary */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                                            <CircleDot className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {fd.jobNo}
                                                <span className="font-normal text-slate-500 ml-2">— {formatDate(fd.date)}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Vendor: <span className="font-medium text-slate-700">{assignment.vendorName}</span>
                                                {fd.rsNo && <span className="ml-2">• RS: {fd.rsNo}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {pendingCount > 0 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                {pendingCount} Pending
                                            </span>
                                        )}
                                        {reassignedCount > 0 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {reassignedCount} Reassigned
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded */}
                                {isExpanded && (
                                    <div className="border-t">
                                        {/* Pending Sections List */}
                                        <div className="p-4">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Pending Sections</h4>
                                            <div className="space-y-3">
                                                {sections.map((section, sIdx) => {
                                                    const isPending = sectionStatuses[sIdx] === 'pending';
                                                    const isRetake = reviewStatuses[sIdx] === 'retake';
                                                    const isRepair = reviewStatuses[sIdx] === 'repair';
                                                    const isReassigned = sectionStatuses[sIdx] === 'reassigned';

                                                    if (!isPending && !isRetake && !isRepair && !isReassigned) return null;
                                                    
                                                    const reason = reviewDescriptions[sIdx] || '';
                                                    let childVendorName = null;
                                                    if (isReassigned) {
                                                        const child = childAssignments.find(c => c.sheet.sections.some(cs => cs.serialNo === section.serialNo));
                                                        if (child) childVendorName = child.vendorName;
                                                    }

                                                    return (
                                                        <table key={sIdx} className={`w-full border-collapse border border-slate-400 text-sm ${isReassigned ? 'opacity-70' : ''}`}>
                                                            <thead>
                                                                <tr>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-amber-50 w-[15%]">Serial No:</th>
                                                                    <th colSpan={2} className="border border-slate-400 px-3 py-1.5 text-left font-medium">{section.serialNo || '—'}</th>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {isReassigned && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                    Out for Reassignment {childVendorName ? `(${childVendorName})` : ''}
                                                                                </span>
                                                                            )}
                                                                            {!isReassigned && isRetake && (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                                    <RotateCcw className="h-3 w-3" /> Retake
                                                                                </span>
                                                                            )}
                                                                            {!isReassigned && isRepair && (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                    <Wrench className="h-3 w-3" /> Repair
                                                                                </span>
                                                                            )}
                                                                            {!isReassigned && isPending && !isRetake && !isRepair && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                                    Pending
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                {reason && (
                                                                    <tr>
                                                                        <td colSpan={2} className="border border-slate-400 px-3 py-1.5 bg-orange-50 text-sm text-slate-700">
                                                                            <span className="font-medium">Reason:</span> {reason}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                <tr>
                                                                    <th className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-left w-[25%] text-slate-700 shadow-sm">WELD IDENTIFICATION</th>
                                                                    <th className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center w-16 text-slate-700 shadow-sm">SPOT NO</th>
                                                                    <th className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center w-20 text-slate-700 shadow-sm">FILM SIZE</th>
                                                                    <th colSpan="2" className="border-y border-r border-slate-400 px-2 py-1 bg-slate-100 text-center text-slate-700 shadow-sm">OBSERVATION</th>
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
                                                                                        <td className="border-r border-slate-400 px-2 py-1.5 text-center w-20 bg-white font-medium text-slate-800 border-b border-slate-200">
                                                                                            {vData.observations[0].value || '—'}
                                                                                            {vData.observations[0].status === 'complete' && <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-500" />}
                                                                                        </td>
                                                                                        <td rowSpan={obsCount} className="p-2 text-slate-700 whitespace-pre-wrap align-top bg-white w-48 font-medium">
                                                                                            {vData.remark !== undefined ? vData.remark : (row.remark || '—')}
                                                                                        </td>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-12 text-slate-400 text-xs">N/A</td>
                                                                                        <td className="border-r border-slate-400 px-2 py-1 text-center bg-slate-50 w-20 text-slate-400 text-xs">N/A</td>
                                                                                        <td rowSpan={obsCount} className="p-2 text-slate-500 whitespace-pre-wrap align-top bg-white w-48 italic">
                                                                                            {vData.remark !== undefined ? vData.remark : (row.remark || '—')}
                                                                                        </td>
                                                                                    </>
                                                                                )}
                                                                            </tr>
                                                                            
                                                                            {vData.observations.slice(1).map((obs, offsetIdx) => (
                                                                                <tr key={offsetIdx + 1} className="border-b border-slate-200 last:border-b-0">
                                                                                    <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-slate-100/50 w-12 font-medium">{obs.label}</td>
                                                                                    <td className="border-r border-slate-400 px-2 py-1.5 text-center w-20 bg-white font-medium text-slate-800">
                                                                                        {obs.value || '—'}
                                                                                        {obs.status === 'complete' && <CheckCircle2 className="inline ml-1 h-3 w-3 text-green-500" />}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Reassign Section - Only show if there are sections that can be reassigned */}
                                        {pendingCount > 0 && (
                                            <div className="border-t px-4 py-4 bg-slate-50">
                                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Reassign Pending Sections to Vendor</h4>
                                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                                    <div className="flex-1 space-y-1.5">
                                                        <label className="text-sm font-medium text-slate-600">Select Vendor</label>
                                                        <Select
                                                            value={reassignVendor[assignment.id] || ''}
                                                            onValueChange={(val) => setReassignVendor((prev) => ({ ...prev, [assignment.id]: val }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Choose a vendor..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {vendors.map((v) => (
                                                                    <SelectItem key={v.id} value={v.id}>
                                                                        {v.vendorNo} — {v.vendorName}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleReassign(assignment.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                        Reassign
                                                    </Button>
                                                </div>
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
