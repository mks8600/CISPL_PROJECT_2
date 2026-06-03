import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TrendingUp, ChevronDown, ChevronUp, Clock, CheckCircle2, CircleDot, SendHorizonal, RotateCcw, Wrench, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { vendorOrdersApi, vendorFilmSizesApi } from '@/lib/api/client';

function validateAssignmentData(assignment) {
    const errors = [];
    if (!assignment || !assignment.sheet) return errors;

    (assignment.sheet.sections || []).forEach((section, sIdx) => {
        const isSkipped = !!assignment.vendorData?.[sIdx]?.[0]?.skipObservation;
        if (!isSkipped) {
            const rows = section.rows || [];
            rows.forEach((row, rIdx) => {
                const rowData = assignment.vendorData?.[sIdx]?.[rIdx];
                const spotNo = rowData?.spotNo;
                const observations = rowData?.observations || [];

                if (!spotNo || isNaN(parseInt(spotNo, 10)) || parseInt(spotNo, 10) <= 0) {
                    errors.push(`Section "${section.serialNo || sIdx + 1}", Weld "${row.jobWeldDescription || rIdx + 1}": Spot count must be entered.`);
                } else if (observations.length === 0) {
                    errors.push(`Section "${section.serialNo || sIdx + 1}", Weld "${row.jobWeldDescription || rIdx + 1}": Observations must be generated (spot count > 0).`);
                } else {
                    observations.forEach((obs, obsIdx) => {
                        if (!obs.value || obs.value === '') {
                            errors.push(`Section "${section.serialNo || sIdx + 1}", Weld "${row.jobWeldDescription || rIdx + 1}": Observation #${obsIdx + 1} (${obs.label || `Spot ${obsIdx + 1}`}) must have a value selected.`);
                        }
                    });
                }
            });
        }
    });
    return errors;
}

const debounceTimers = {};
function debouncedSave(assignmentId, payload) {
    if (debounceTimers[assignmentId]) clearTimeout(debounceTimers[assignmentId]);
    debounceTimers[assignmentId] = setTimeout(() => {
        vendorOrdersApi.saveData(assignmentId, payload).catch(err => {
            console.error('Failed to sync vendor data', err);
            toast.error('Failed to save data. Please check your connection and try again.');
        });
    }, 1000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getColName(index) {
    let columnName = "";
    while (index >= 0) {
        columnName = String.fromCharCode((index % 26) + 65) + columnName;
        index = Math.floor(index / 26) - 1;
    }
    return columnName;
}

function generateObservationLabel(i, N, format) {
    if (format === 'serial') {
        return (i + 1).toString();
    }
    if (format === 'alphabetic') {
        if (N === 1) return 'A-B';
        const char1 = getColName(i);
        const char2 = getColName((i + 1) % N);
        return `${char1}-${char2}`;
    }
    // Default is 'numeric'
    if (N === 1) return '0-1';
    return `${i}-${(i + 1) === N ? 0 : i + 1}`;
}

export default function VendorOrderProgressPage() {
    const { user } = useAuth();
    const [acceptedOrders, setAcceptedOrders] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [filmSizes, setFilmSizes] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isValidationErrorOpen, setIsValidationErrorOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'submitted'

    const loadOrders = async () => {
        try {
            const [ordersRes, filmsRes] = await Promise.all([
                vendorOrdersApi.list(),
                vendorFilmSizesApi.list().catch(() => [])
            ]);
            setFilmSizes(filmsRes.map(f => f.size || f.size_label || f));

            // Backend already sends camelCase — just filter accepted
            const accepted = ordersRes.filter((a) => a.status === 'accepted');
            setAcceptedOrders(accepted);
            window.dispatchEvent(new CustomEvent('cispl:pending-orders-updated'));
        } catch (err) {
            toast.error('Failed to load orders');
        }
    };

    useEffect(() => {
        loadOrders();
        const onFocus = () => loadOrders();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.id]);

    const handleSectionStatus = (assignmentId, sectionIndex, newStatus) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const sectionStatuses = [...a.sectionStatuses];
                    sectionStatuses[sectionIndex] = newStatus;
                    return { ...a, sectionStatuses };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            debouncedSave(assignmentId, { vendorData: changed.vendorData, sectionStatuses: changed.sectionStatuses });
            return updated;
        });
        toast.success(`Section marked as ${newStatus}`);
    };

    const handleVendorDataChange = (assignmentId, sIdx, rIdx, field, value) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (!newVendorData[sIdx]) newVendorData[sIdx] = {};
                    if (!newVendorData[sIdx][rIdx]) newVendorData[sIdx][rIdx] = { spotNo: '', filmSize: '', observations: [] };

                    newVendorData[sIdx][rIdx][field] = value;

                    if (field === 'spotNo') {
                        const N = parseInt(value, 10);
                        const existingObs = newVendorData[sIdx][rIdx].observations || [];
                        const newObservations = [];
                        if (!isNaN(N) && N > 0 && N <= 100) {
                            const format = newVendorData[sIdx].seriesType || 'numeric';
                            for (let i = 0; i < N; i++) {
                                let label = generateObservationLabel(i, N, format);
                                newObservations.push({
                                    label,
                                    value: existingObs[i]?.value || '',
                                    status: existingObs[i]?.status || 'pending'
                                });
                            }
                        }
                        newVendorData[sIdx][rIdx].observations = newObservations;
                    }

                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });
    };

    const handleObservationStatus = (assignmentId, sIdx, rIdx, obsIdx, newStatus) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (newVendorData[sIdx] && newVendorData[sIdx][rIdx] && newVendorData[sIdx][rIdx].observations && newVendorData[sIdx][rIdx].observations[obsIdx]) {
                        newVendorData[sIdx][rIdx].observations[obsIdx].status = newStatus;
                    }
                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });
        toast.success(`Observation status updated to ${newStatus}`);
    };

    const handleObservationValue = (assignmentId, sIdx, rIdx, obsIdx, value) => {
        const finalValue = value === 'none' ? '' : value;
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (newVendorData[sIdx] && newVendorData[sIdx][rIdx] && newVendorData[sIdx][rIdx].observations && newVendorData[sIdx][rIdx].observations[obsIdx]) {
                        newVendorData[sIdx][rIdx].observations[obsIdx].value = finalValue;
                    }
                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });
    };

    const handleObservationLabel = (assignmentId, sIdx, rIdx, obsIdx, label) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (newVendorData[sIdx] && newVendorData[sIdx][rIdx] && newVendorData[sIdx][rIdx].observations && newVendorData[sIdx][rIdx].observations[obsIdx]) {
                        newVendorData[sIdx][rIdx].observations[obsIdx].label = label;
                    }
                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });
    };

    const handleSkipObservation = (assignmentId, sIdx, isSkipped) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (!newVendorData[sIdx]) newVendorData[sIdx] = {};
                    
                    const section = a.sheet.sections[sIdx];
                    (section.rows || []).forEach((row, rIdx) => {
                        if (!newVendorData[sIdx][rIdx]) {
                            newVendorData[sIdx][rIdx] = { spotNo: '', filmSize: '', observations: [] };
                        }
                        newVendorData[sIdx][rIdx].skipObservation = isSkipped;
                    });

                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });
    };

    const handleMarkAllSectionComplete = (assignmentId, sIdx) => {
        const assignment = acceptedOrders.find(a => a.id === assignmentId);
        if (!assignment) return;

        let allComplete = true;
        let hasObs = false;
        if (assignment.vendorData?.[sIdx]) {
            Object.keys(assignment.vendorData[sIdx]).forEach(rIdx => {
                const obs = assignment.vendorData[sIdx][rIdx]?.observations || [];
                if (obs.length > 0) {
                    hasObs = true;
                    if (obs.some(o => o.status !== 'complete')) {
                        allComplete = false;
                    }
                }
            });
        }

        if (!hasObs) {
            toast.error("Please enter a spot number first to create observations");
            return;
        }

        const targetStatus = allComplete ? 'pending' : 'complete';

        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (newVendorData[sIdx]) {
                        Object.keys(newVendorData[sIdx]).forEach(rIdx => {
                            if (newVendorData[sIdx][rIdx] && newVendorData[sIdx][rIdx].observations) {
                                newVendorData[sIdx][rIdx].observations.forEach(obs => {
                                    obs.status = targetStatus;
                                });
                            }
                        });
                    }
                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });

        toast.success(targetStatus === 'complete' 
            ? "All observations in this section marked as complete" 
            : "All observations in this section marked as pending"
        );
    };

    const handleSectionSeriesTypeChange = (assignmentId, sIdx, format) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    if (!newVendorData[sIdx]) newVendorData[sIdx] = {};
                    newVendorData[sIdx].seriesType = format;

                    // Update existing observations labels in all rows of this section
                    Object.keys(newVendorData[sIdx]).forEach(rIdx => {
                        if (rIdx === 'seriesType') return;
                        const rowData = newVendorData[sIdx][rIdx];
                        if (rowData && rowData.observations && rowData.observations.length > 0) {
                            const N = rowData.observations.length;
                            rowData.observations.forEach((obs, i) => {
                                obs.label = generateObservationLabel(i, N, format);
                            });
                        }
                    });

                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses
                });
            }
            return updated;
        });
        toast.success(`Observation label format changed to ${format === 'serial' ? 'Serial (1,2,3...)' : format === 'alphabetic' ? 'Alphabetical (A-B...)' : 'Numeric Range (0-1...)'}`);
    };

    const handleSubmitSheet = async (assignmentId) => {
        try {
            const assignment = acceptedOrders.find(a => a.id === assignmentId);
            if (!assignment) return;

            const errors = validateAssignmentData(assignment);
            if (errors.length > 0) {
                setValidationErrors(errors);
                setIsValidationErrorOpen(true);
                return;
            }

            const completedStatuses = assignment.sectionStatuses.map(s => s === 'pending' ? 'complete' : s);
            
            await vendorOrdersApi.submit(assignmentId, {
                vendorData: assignment.vendorData,
                sectionStatuses: completedStatuses
            });
            
            setAcceptedOrders(prev => prev.map(a => {
                if(a.id === assignmentId) {
                    return { ...a, submitted: true, submittedAt: new Date().toISOString(), sectionStatuses: completedStatuses };
                }
                return a;
            }));
            
            toast.success('Sheet submitted to company!');
            window.dispatchEvent(new CustomEvent('cispl:pending-orders-updated'));
        } catch (error) {
            toast.error('Failed to submit, please try again.');
        }
    };

    const pendingOrders = acceptedOrders.filter(a => !a.submitted);
    const submittedOrders = acceptedOrders.filter(a => a.submitted);
    const activeOrdersList = activeTab === 'pending' ? pendingOrders : submittedOrders;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-900">Order Progress</h1>
                </div>
                <p className="text-slate-500">Track your accepted orders and update section status</p>
            </div>

            {/* Orders */}
            {acceptedOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <TrendingUp className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-medium">No accepted orders yet.</p>
                            <p className="text-sm mt-1">Accept orders from the My Orders page to see them here.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Modern Tabs UI */}
                    <div className="flex border-b border-slate-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all duration-300 outline-none ${
                                activeTab === 'pending'
                                    ? 'border-emerald-600 text-emerald-600 font-bold bg-emerald-50/20'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <span>Pending to Submit</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-300 ${
                                activeTab === 'pending' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {pendingOrders.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('submitted')}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all duration-300 outline-none ${
                                activeTab === 'submitted'
                                    ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <span>Submitted for Review</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-300 ${
                                activeTab === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {submittedOrders.length}
                            </span>
                        </button>
                    </div>

                    {activeOrdersList.length === 0 ? (
                        activeTab === 'pending' ? (
                            <Card className="bg-white/50 border border-dashed border-slate-200">
                                <CardContent className="py-16 text-center text-slate-500">
                                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3 animate-pulse" />
                                    <p className="font-semibold text-slate-700 text-base">All Caught Up!</p>
                                    <p className="text-sm mt-1 text-slate-500">No pending sheets to submit. If you just submitted a sheet, it will appear under the "Submitted for Review" tab.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-white/50 border border-dashed border-slate-200">
                                <CardContent className="py-16 text-center text-slate-500">
                                    <Clock className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                                    <p className="font-semibold text-slate-700 text-base">No Sheets Submitted Yet</p>
                                    <p className="text-sm mt-1 text-slate-500">Once you complete and submit a sheet, it will show up here for review by the company.</p>
                                </CardContent>
                            </Card>
                        )
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{activeOrdersList.length}</span> sheet{activeOrdersList.length === 1 ? '' : 's'}</p>
                                <p className="text-xs text-slate-400">Scroll to view all</p>
                            </div>
                            <div
                                className="border border-slate-200 rounded-xl bg-white/50 shadow-sm"
                                style={{ maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}
                            >
                                <div className="space-y-4 p-4">
                                    {activeOrdersList.map((assignment) => {
                        const fd = assignment.sheet.formData;
                        const isExpanded = expandedId === assignment.id;
                        let totalObs = 0;
                        let completedObs = 0;
                        assignment.sheet.sections.forEach((sec, sIdx) => {
                            (sec.rows || []).forEach((row, rIdx) => {
                                const vData = assignment.vendorData?.[sIdx]?.[rIdx];
                                if (vData?.observations) {
                                    totalObs += vData.observations.length;
                                    completedObs += vData.observations.filter(o => o.status === 'complete').length;
                                }
                            });
                        });

                        return (
                            <Card key={assignment.id} className="overflow-hidden">
                                {/* Summary */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-green-50 flex items-center justify-center text-green-600">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {fd.jobNo || '—'}
                                                <span className="font-normal text-slate-500 ml-2">— {formatDate(fd.date)}</span>
                                            </p>
                                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                                <span>RS No: {fd.rsNo || '—'}</span>
                                                <span>•</span>
                                                <Clock className="h-3 w-3" />
                                                <span>Accepted: {formatDate(assignment.respondedAt)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">
                                            {completedObs}/{totalObs} Obs Complete
                                        </span>
                                        {assignment.reassignedFrom && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                Reassigned
                                            </span>
                                        )}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Accepted
                                        </span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Full Sheet */}
                                {isExpanded && (
                                    <div className="border-t">
                                        {/* Radiographic Requisition Sheet */}
                                        <div className="p-4">
                                            <table className="w-full border-collapse border border-slate-400 text-sm">
                                                <thead>
                                                    <tr>
                                                        <th colSpan={4} className="border border-slate-400 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-800">
                                                            Radiographic requisition sheet
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 w-[15%] bg-slate-50">RS NO.:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 w-[35%]">{fd.rsNo || '—'}</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 w-[15%] bg-slate-50">Date:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 w-[35%]">{formatDate(fd.date)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Job no.:</td>
                                                        <td colSpan={3} className="border border-slate-400 px-3 py-1.5">{fd.jobNo || '—'}</td>
                                                    </tr>

                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Detail Sections with Status Toggle */}
                                        {assignment.sheet.sections.length > 0 && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {assignment.sheet.sections.map((section, sIdx) => {
                                                    const rStatus = assignment.reviewStatuses[sIdx];
                                                    const rDesc = assignment.reviewDescriptions[sIdx] || '';
                                                    
                                                    let hasObservations = false;
                                                    let allObservationsCompleted = true;
                                                    if (assignment.vendorData?.[sIdx]) {
                                                        Object.keys(assignment.vendorData[sIdx]).forEach(rIdx => {
                                                            const obs = assignment.vendorData[sIdx][rIdx]?.observations || [];
                                                            if (obs.length > 0) {
                                                                hasObservations = true;
                                                                if (obs.some(o => o.status !== 'complete')) {
                                                                    allObservationsCompleted = false;
                                                                }
                                                            }
                                                        });
                                                    }
                                                    return (
                                                        <table key={sIdx} className="w-full border-collapse border border-slate-400 text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-slate-50 w-[15%]">Serial No:</th>
                                                                    <th colSpan={7} className="border border-slate-400 px-3 py-1.5 text-left font-medium">
                                                                        <span>{section.serialNo || '—'}</span>
                                                                    </th>
                                                                </tr>
                                                                {/* Company Review Badge Row */}
                                                                <tr>
                                                                    <th colSpan={8} className={`border border-slate-400 px-3 py-1.5 text-left text-xs ${rStatus === 'ok' ? 'bg-green-50' :
                                                                        rStatus === 'retake' ? 'bg-orange-50' :
                                                                            rStatus === 'repair' ? 'bg-red-50' :
                                                                                'bg-slate-50'
                                                                        }`}>
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-slate-600">Company Review:</span>
                                                                                {rStatus === 'ok' && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                        <Check className="h-3 w-3" /> OK
                                                                                    </span>
                                                                                )}
                                                                                {rStatus === 'retake' && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                                        <RotateCcw className="h-3 w-3" /> Retake
                                                                                    </span>
                                                                                )}
                                                                                {rStatus === 'repair' && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                        <Wrench className="h-3 w-3" /> Repair
                                                                                    </span>
                                                                                )}
                                                                                {!rStatus && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                                                        Not Reviewed
                                                                                    </span>
                                                                                )}
                                                                                {rDesc && (rStatus === 'retake' || rStatus === 'repair') && (
                                                                                    <span className="text-slate-600">— {rDesc}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col items-end gap-2">
                                                                                {/* Series Format Selector */}
                                                                                {assignment.submitted ? (
                                                                                    <div className="text-[9px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                                                                        Series: {
                                                                                            (assignment.vendorData?.[sIdx]?.seriesType === 'serial') ? '1, 2, 3...' :
                                                                                            (assignment.vendorData?.[sIdx]?.seriesType === 'alphabetic') ? 'A-B, B-C...' :
                                                                                            '0-1, 1-2...'
                                                                                        }
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded border border-slate-200 shadow-sm">
                                                                                        <span className="text-[9px] font-semibold text-slate-500 px-1.5 uppercase">Series:</span>
                                                                                        {[
                                                                                            { id: 'numeric', label: '0-1, 1-2...' },
                                                                                            { id: 'alphabetic', label: 'A-B, B-C...' },
                                                                                            { id: 'serial', label: '1, 2, 3...' }
                                                                                        ].map((item) => {
                                                                                            const active = (assignment.vendorData?.[sIdx]?.seriesType || 'numeric') === item.id;
                                                                                            return (
                                                                                                <button
                                                                                                    key={item.id}
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        handleSectionSeriesTypeChange(assignment.id, sIdx, item.id);
                                                                                                    }}
                                                                                                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${
                                                                                                        active 
                                                                                                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                                                                                                            : 'text-slate-500 hover:text-slate-800 border border-transparent'
                                                                                                    }`}
                                                                                                >
                                                                                                    {item.label}
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}

                                                                                {/* Action Buttons */}
                                                                                <div className="flex items-center gap-2">
                                                                                    {hasObservations && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                handleMarkAllSectionComplete(assignment.id, sIdx);
                                                                                            }}
                                                                                            disabled={assignment.submitted}
                                                                                            className={`flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded border shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                                                allObservationsCompleted
                                                                                                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                                                                                                    : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                                                                                            }`}
                                                                                        >
                                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                                            {allObservationsCompleted ? 'UNMARK ALL COMPLETE' : 'MARK ALL COMPLETE'}
                                                                                        </button>
                                                                                    )}
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            const isSkipped = assignment.vendorData?.[sIdx]?.[0]?.skipObservation;
                                                                                            handleSkipObservation(assignment.id, sIdx, !isSkipped);
                                                                                        }}
                                                                                        disabled={assignment.submitted}
                                                                                        className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold rounded border shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                                            assignment.vendorData?.[sIdx]?.[0]?.skipObservation 
                                                                                                ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200' 
                                                                                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                                                                        }`}
                                                                                    >
                                                                                        <input 
                                                                                            type="checkbox" 
                                                                                            className="rounded border-slate-300 w-3 h-3 cursor-pointer accent-amber-600"
                                                                                            checked={assignment.vendorData?.[sIdx]?.[0]?.skipObservation || false}
                                                                                            disabled={assignment.submitted}
                                                                                            readOnly
                                                                                        />
                                                                                        {assignment.vendorData?.[sIdx]?.[0]?.skipObservation ? 'OBSERVATION SKIPPED' : 'SKIP OBSERVATION'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                <tr>
                                                                    <th className="border border-slate-400 px-2 py-1 bg-slate-100 text-left w-[25%] text-slate-700">WELD IDENTIFICATION</th>
                                                                    <th className="border border-slate-400 px-2 py-1 bg-slate-100 text-center w-16 text-slate-700">SPOT NO</th>
                                                                    <th className="border border-slate-400 px-2 py-1 bg-slate-100 text-center w-20 text-slate-700">FILM SIZE</th>
                                                                    <th colSpan="2" className="border border-slate-400 px-2 py-1 bg-slate-100 text-center text-slate-700"> VENDOR OBSERVATION</th>
                                                                    <th className="border border-slate-400 px-2 py-1 bg-slate-100 text-left text-slate-700">REMARKS</th>
                                                                    <th colSpan="2" className="border border-slate-400 px-2 py-1 bg-slate-100 text-center text-slate-700 w-36">ACTIVITY</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(section.rows || []).map((row, rIdx) => {
                                                                    const rawVData = assignment.vendorData?.[sIdx]?.[rIdx] || {};
                                                                    const vData = { 
                                                                        spotNo: rawVData.spotNo || '', 
                                                                        filmSize: rawVData.filmSize || '', 
                                                                        observations: rawVData.observations || [],
                                                                        remark: rawVData.remark,
                                                                        skipObservation: rawVData.skipObservation || false
                                                                    };
                                                                    const obsCount = Math.max(1, vData.observations.length);

                                                                    return (
                                                                        <React.Fragment key={rIdx}>
                                                                            {/* Main row, spans the number of observations */}
                                                                            <tr>
                                                                                <td rowSpan={obsCount} className="border border-slate-400 px-2 py-1 font-semibold text-blue-900 bg-blue-50/50 break-all whitespace-pre-wrap min-w-[150px] max-w-[200px]">
                                                                                    {row.jobWeldDescription || '—'}
                                                                                </td>
                                                                                <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white">
                                                                                    <input type="number"
                                                                                        className="w-full h-full min-h-[36px] p-2 text-center border-0 outline-none ring-0 appearance-none m-0 disabled:bg-slate-50 disabled:text-slate-500"
                                                                                        value={vData.spotNo}
                                                                                        disabled={assignment.submitted}
                                                                                        onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'spotNo', e.target.value)} />
                                                                                </td>
                                                                                <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white">
                                                                                    {filmSizes.length > 0 ? (
                                                                                        <Select
                                                                                            value={vData.filmSize || ''}
                                                                                            onValueChange={val => handleVendorDataChange(assignment.id, sIdx, rIdx, 'filmSize', val)}
                                                                                            disabled={assignment.submitted}
                                                                                        >
                                                                                            <SelectTrigger className="w-full h-full min-h-[36px] border-0 rounded-none shadow-none focus:ring-0 px-2 text-center justify-center font-medium bg-transparent overflow-hidden disabled:opacity-50">
                                                                                                <SelectValue placeholder="Size" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {filmSizes.map((size, idx) => (
                                                                                                    <SelectItem key={idx} value={size}>{size}</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    ) : (
                                                                                        <input type="text"
                                                                                            className="w-full h-full min-h-[36px] p-2 text-center border-0 outline-none ring-0 w-20 disabled:bg-slate-50 disabled:text-slate-500"
                                                                                            value={vData.filmSize || ''}
                                                                                            disabled={assignment.submitted}
                                                                                            onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'filmSize', e.target.value)}
                                                                                            placeholder="Size" />
                                                                                    )}
                                                                                </td>

                                                                                {/* 1st Observation */}
                                                                                {vData.observations.length > 0 ? (
                                                                                    <>
                                                                                        <td className="border border-slate-400 p-0 align-top bg-white w-16">
                                                                                            <input
                                                                                                type="text"
                                                                                                className="w-full h-full min-h-[32px] p-1 text-center border-0 outline-none ring-0 text-xs font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                                                                                                value={vData.observations[0].label || ''}
                                                                                                disabled={assignment.submitted}
                                                                                                onChange={e => handleObservationLabel(assignment.id, sIdx, rIdx, 0, e.target.value)}
                                                                                                placeholder="Obs."
                                                                                            />
                                                                                        </td>
                                                                                        <td className="border border-slate-400 p-0 align-top bg-white w-20">
                                                                                            <Select
                                                                                                value={vData.observations[0].value || ''}
                                                                                                onValueChange={val => handleObservationValue(assignment.id, sIdx, rIdx, 0, val)}
                                                                                                disabled={vData.skipObservation || assignment.submitted}
                                                                                            >
                                                                                                <SelectTrigger className="w-full h-full min-h-[32px] border-0 rounded-none shadow-none focus:ring-0 px-1 text-center justify-center font-medium bg-transparent overflow-hidden text-xs disabled:opacity-50">
                                                                                                    <SelectValue placeholder="—" />
                                                                                                </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="none" className="text-slate-400 italic">Deselect</SelectItem>
                                                                                                        <SelectItem value="OK">OK</SelectItem>
                                                                                                        <SelectItem value="R/S">R/S</SelectItem>
                                                                                                        <SelectItem value="Repair">Repair</SelectItem>
                                                                                                        <SelectItem value="Retake">Retake</SelectItem>
                                                                                                        <SelectItem value="Missing">Missing</SelectItem>
                                                                                                        <SelectItem value="Porosity">Porosity</SelectItem>
                                                                                                    </SelectContent>
                                                                                            </Select>
                                                                                        </td>
                                                                                        <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white w-48">
                                                                                            <textarea
                                                                                                className="w-full h-full min-h-[36px] p-2 border-0 outline-none resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                                                                                value={vData.remark !== undefined ? vData.remark : (row.remark || '')}
                                                                                                disabled={assignment.submitted}
                                                                                                onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'remark', e.target.value)}
                                                                                                placeholder="Add remark..."
                                                                                            />
                                                                                        </td>
                                                                                        <td className="border border-slate-400 p-0 bg-white">
                                                                                            <button
                                                                                                onClick={() => handleObservationStatus(assignment.id, sIdx, rIdx, 0, vData.observations[0].status === 'complete' ? 'pending' : 'complete')}
                                                                                                disabled={assignment.submitted}
                                                                                                className={`w-full h-full min-h-[32px] text-[10px] font-bold px-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${vData.observations[0].status === 'complete' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}>
                                                                                                {vData.observations[0].status === 'complete' ? 'MARK PENDING' : 'MARK COMPLETE'}
                                                                                            </button>
                                                                                        </td>
                                                                                        <td className={`border border-slate-400 px-1 py-1 text-center text-[10px] font-bold w-16 ${vData.observations[0].status === 'complete' ? 'bg-slate-200' : 'bg-slate-100'} text-slate-600`}>
                                                                                            {vData.observations[0].status === 'complete' ? 'SUCCESS' : 'PENDING'}
                                                                                        </td>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <td className="border border-slate-400 px-2 py-1 bg-white w-12 text-slate-300 text-center text-xs">N/A</td>
                                                                                        <td className="border border-slate-400 px-2 py-1 bg-white w-20 text-slate-300 text-center text-xs">N/A</td>
                                                                                        <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white w-48">
                                                                                            <textarea
                                                                                                className="w-full h-full min-h-[36px] p-2 border-0 outline-none resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                                                                                value={vData.remark !== undefined ? vData.remark : (row.remark || '')}
                                                                                                disabled={assignment.submitted}
                                                                                                onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'remark', e.target.value)}
                                                                                                placeholder="Add remark..."
                                                                                            />
                                                                                        </td>
                                                                                        <td className="border border-slate-400 px-2 py-1 bg-white"></td>
                                                                                        <td className="border border-slate-400 px-2 py-1 bg-white"></td>
                                                                                    </>
                                                                                )}
                                                                            </tr>

                                                                            {/* Map remaining observations (if any) */}
                                                                            {vData.observations.slice(1).map((obs, offsetIdx) => {
                                                                                const obsIdx = offsetIdx + 1;
                                                                                return (
                                                                                    <tr key={obsIdx}>
                                                                                        <td className="border border-slate-400 p-0 align-top bg-white w-16">
                                                                                            <input
                                                                                                type="text"
                                                                                                className="w-full h-full min-h-[32px] p-1 text-center border-0 outline-none ring-0 text-xs font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                                                                                                value={obs.label || ''}
                                                                                                disabled={assignment.submitted}
                                                                                                onChange={e => handleObservationLabel(assignment.id, sIdx, rIdx, obsIdx, e.target.value)}
                                                                                                placeholder="Obs."
                                                                                            />
                                                                                        </td>
                                                                                        <td className="border border-slate-400 p-0 align-top bg-white w-20">
                                                                                            <Select
                                                                                                value={obs.value || ''}
                                                                                                onValueChange={val => handleObservationValue(assignment.id, sIdx, rIdx, obsIdx, val)}
                                                                                                disabled={vData.skipObservation || assignment.submitted}
                                                                                            >
                                                                                                <SelectTrigger className="w-full h-full min-h-[32px] border-0 rounded-none shadow-none focus:ring-0 px-1 text-center justify-center font-medium bg-transparent overflow-hidden text-xs disabled:opacity-50">
                                                                                                    <SelectValue placeholder="—" />
                                                                                                </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="none" className="text-slate-400 italic">Deselect</SelectItem>
                                                                                                        <SelectItem value="OK">OK</SelectItem>
                                                                                                        <SelectItem value="R/S">R/S</SelectItem>
                                                                                                        <SelectItem value="Repair">Repair</SelectItem>
                                                                                                        <SelectItem value="Retake">Retake</SelectItem>
                                                                                                        <SelectItem value="Missing">Missing</SelectItem>
                                                                                                        <SelectItem value="Porosity">Porosity</SelectItem>
                                                                                                    </SelectContent>
                                                                                            </Select>
                                                                                        </td>
                                                                                        <td className="border border-slate-400 p-0 bg-white">
                                                                                            <button
                                                                                                onClick={() => handleObservationStatus(assignment.id, sIdx, rIdx, obsIdx, obs.status === 'complete' ? 'pending' : 'complete')}
                                                                                                disabled={assignment.submitted}
                                                                                                className={`w-full h-full min-h-[32px] text-[10px] font-bold px-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${obs.status === 'complete' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}>
                                                                                                {obs.status === 'complete' ? 'MARK PENDING' : 'MARK COMPLETE'}
                                                                                            </button>
                                                                                        </td>
                                                                                        <td className={`border border-slate-400 px-1 py-1 text-center text-[10px] font-bold w-16 ${obs.status === 'complete' ? 'bg-slate-200' : 'bg-slate-100'} text-slate-600`}>
                                                                                            {obs.status === 'complete' ? 'SUCCESS' : 'PENDING'}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <div className="px-4 py-3 border-t bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="text-xs text-slate-500 font-medium">
                                                {!assignment.submitted && validateAssignmentData(assignment).length > 0 && (
                                                    <span className="text-amber-600 flex items-center gap-1">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        Missing required vendor observations. Click submit to view details.
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                {assignment.submitted ? (
                                                    <div className="flex items-center gap-2 text-sm text-green-700">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="font-medium">Submitted</span>
                                                        <span className="text-slate-400">({formatDate(assignment.submittedAt)})</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleSubmitSheet(assignment.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <SendHorizonal className="h-4 w-4" />
                                                        Submit to Company
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Validation Error Dialog */}
            <Dialog open={isValidationErrorOpen} onOpenChange={setIsValidationErrorOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2 text-lg font-bold">
                            <AlertTriangle className="h-5 w-5 text-red-500" /> Validation Required
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm">
                            Please fill out all observation values before submitting this sheet.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-60 overflow-y-auto space-y-2 py-2 pr-1">
                        {validationErrors.map((error, idx) => (
                            <div key={idx} className="flex gap-2 text-xs text-red-800 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                                <span className="text-red-500 font-bold">•</span>
                                <span>{error}</span>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsValidationErrorOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white w-full">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
