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
import { TrendingUp, ChevronDown, ChevronUp, Clock, CheckCircle2, CircleDot, SendHorizonal, RotateCcw, Wrench, Check } from 'lucide-react';
import { toast } from 'sonner';

import { vendorOrdersApi, vendorFilmSizesApi } from '@/lib/api/client';

const debounceTimers = {};
function debouncedSave(assignmentId, payload) {
    if (debounceTimers[assignmentId]) clearTimeout(debounceTimers[assignmentId]);
    debounceTimers[assignmentId] = setTimeout(() => {
        vendorOrdersApi.saveData(assignmentId, payload).catch(err => {
            console.error('Failed to sync vendor data', err);
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

export default function VendorOrderProgressPage() {
    const { user } = useAuth();
    const [acceptedOrders, setAcceptedOrders] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [filmSizes, setFilmSizes] = useState([]);

    const loadOrders = async () => {
        try {
            const [ordersRes, filmsRes] = await Promise.all([
                vendorOrdersApi.list(),
                vendorFilmSizesApi.list().catch(() => []) // Fallback to empty array if fails
            ]);
            setFilmSizes(filmsRes);

            const accepted = ordersRes.filter((a) => a.status === 'accepted');
            
            // Map snake_case to camelCase deeply to prevent undefined crashes
            const mappedOrders = accepted.map(a => {
                const sheetData = a.sheet_data || a.sheet || {};
                return {
                    ...a,
                    vendorData: a.vendor_data || a.vendorData,
                    sectionStatuses: a.section_statuses || a.sectionStatuses,
                    sheet: {
                        ...sheetData,
                        formData: sheetData.form_data || sheetData.formData || {},
                        sections: sheetData.sections || []
                    }
                };
            });

            setAcceptedOrders(mappedOrders);
        } catch (err) {
            toast.error('Failed to load orders');
        }
    };

    useEffect(() => {
        loadOrders();
        const onFocus = () => loadOrders();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user]);

    const handleSectionStatus = (assignmentId, sectionIndex, newStatus) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const sectionStatuses = a.sectionStatuses ? [...a.sectionStatuses] : a.sheet.sections.map(() => 'pending');
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
                    const newVendorData = a.vendorData ? JSON.parse(JSON.stringify(a.vendorData)) : {};
                    if (!newVendorData[sIdx]) newVendorData[sIdx] = {};
                    if (!newVendorData[sIdx][rIdx]) newVendorData[sIdx][rIdx] = { spotNo: '', filmSize: '', observations: [] };

                    newVendorData[sIdx][rIdx][field] = value;

                    if (field === 'spotNo') {
                        const N = parseInt(value, 10);
                        const existingObs = newVendorData[sIdx][rIdx].observations || [];
                        const newObservations = [];
                        if (!isNaN(N) && N > 0 && N <= 100) {
                            for (let i = 0; i < N; i++) {
                                let label = N === 1 ? '0-1' : `${i}-${(i + 1) === N ? 0 : i + 1}`;
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
                    sectionStatuses: changed.sectionStatuses || (changed.sheet && changed.sheet.sections ? changed.sheet.sections.map(()=>'pending') : [])
                });
            }
            return updated;
        });
    };

    const handleObservationStatus = (assignmentId, sIdx, rIdx, obsIdx, newStatus) => {
        let name = '';
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    newVendorData[sIdx][rIdx].observations[obsIdx].status = newStatus;
                    name = newVendorData[sIdx][rIdx].observations[obsIdx].label;
                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses || (changed.sheet && changed.sheet.sections ? changed.sheet.sections.map(()=>'pending') : [])
                });
            }
            return updated;
        });
        toast.success(`Observation status updated to ${newStatus}`);
    };

    const handleObservationValue = (assignmentId, sIdx, rIdx, obsIdx, value) => {
        setAcceptedOrders(prev => {
            const updated = prev.map((a) => {
                if (a.id === assignmentId) {
                    const newVendorData = JSON.parse(JSON.stringify(a.vendorData || {}));
                    newVendorData[sIdx][rIdx].observations[obsIdx].value = value;
                    return { ...a, vendorData: newVendorData };
                }
                return a;
            });
            const changed = updated.find(a => a.id === assignmentId);
            if (changed) {
                debouncedSave(assignmentId, { 
                    vendorData: changed.vendorData, 
                    sectionStatuses: changed.sectionStatuses || (changed.sheet && changed.sheet.sections ? changed.sheet.sections.map(()=>'pending') : [])
                });
            }
            return updated;
        });
    };

    const handleSubmitSheet = async (assignmentId) => {
        try {
            const assignment = acceptedOrders.find(a => a.id === assignmentId);
            const sectionStatuses = assignment.sectionStatuses ? [...assignment.sectionStatuses] : (assignment.sheet.sections || []).map(() => 'pending');
            const completedStatuses = sectionStatuses.map(s => s === 'pending' ? 'complete' : s);
            
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
        } catch (error) {
            toast.error('Failed to submit, please try again.');
        }
    };
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
                    {acceptedOrders.map((assignment) => {
                        const fd = assignment.sheet.formData;
                        const isExpanded = expandedId === assignment.id;
                        let totalObs = 0;
                        let completedObs = 0;
                        assignment.sheet.sections.forEach((sec, sIdx) => {
                            sec.rows.forEach((row, rIdx) => {
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
                                                {fd.jobNo}
                                                <span className="font-normal text-slate-500 ml-2">— {formatDate(fd.date)}</span>
                                            </p>
                                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                                <span>RS No: {fd.rsNo || '—'}</span>
                                                <span>•</span>
                                                <Clock className="h-3 w-3" />
                                                <span>Accepted: {formatDate(assignment.responded_at || assignment.respondedAt)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">
                                            {completedObs}/{totalObs} Obs Complete
                                        </span>
                                        {(assignment.reassigned_from || assignment.reassignedFrom) && (
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
                                        {assignment.sheet.sections && assignment.sheet.sections.length > 0 && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {assignment.sheet.sections.map((section, sIdx) => {
                                                    const reviewStatuses = assignment.reviewStatuses || assignment.sheet.sections.map(() => null);
                                                    const reviewDescriptions = assignment.reviewDescriptions || assignment.sheet.sections.map(() => '');
                                                    const rStatus = reviewStatuses[sIdx];
                                                    const rDesc = reviewDescriptions[sIdx] || '';
                                                    return (
                                                        <table key={sIdx} className="w-full border-collapse border border-slate-400 text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-slate-50 w-[15%]">Serial No:</th>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-left font-medium">
                                                                        <div className="flex items-center justify-between">
                                                                            <span>{section.serialNo || '—'}</span>
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                {/* Company Review Badge Row */}
                                                                <tr>
                                                                    <th colSpan={2} className={`border border-slate-400 px-3 py-1.5 text-left text-xs ${rStatus === 'ok' ? 'bg-green-50' :
                                                                        rStatus === 'retake' ? 'bg-orange-50' :
                                                                            rStatus === 'repair' ? 'bg-red-50' :
                                                                                'bg-slate-50'
                                                                        }`}>
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
                                                                {section.rows.map((row, rIdx) => {
                                                                    const vData = (assignment.vendorData && assignment.vendorData[sIdx] && assignment.vendorData[sIdx][rIdx]) || { spotNo: '', filmSize: '', observations: [] };
                                                                    const obsCount = Math.max(1, vData.observations.length);

                                                                    return (
                                                                        <React.Fragment key={rIdx}>
                                                                            {/* Main row, spans the number of observations */}
                                                                            <tr>
                                                                                <td rowSpan={obsCount} className="border border-slate-400 px-2 py-1 font-semibold text-blue-900 bg-blue-50/50 break-words whitespace-pre-wrap min-w-[150px]">
                                                                                    {row.jobWeldDescription || '—'}
                                                                                </td>
                                                                                <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white">
                                                                                    <input type="number"
                                                                                        className="w-full h-full min-h-[36px] p-2 text-center border-0 outline-none ring-0 appearance-none m-0"
                                                                                        value={vData.spotNo}
                                                                                        onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'spotNo', e.target.value)} />
                                                                                </td>
                                                                                <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white">
                                                                                    {filmSizes.length > 0 ? (
                                                                                        <Select
                                                                                            value={vData.filmSize || ''}
                                                                                            onValueChange={val => handleVendorDataChange(assignment.id, sIdx, rIdx, 'filmSize', val)}
                                                                                        >
                                                                                            <SelectTrigger className="w-full h-full min-h-[36px] border-0 rounded-none shadow-none focus:ring-0 px-2 text-center justify-center font-medium bg-transparent overflow-hidden">
                                                                                                <SelectValue placeholder="Size" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {filmSizes.map(size => (
                                                                                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    ) : (
                                                                                        <input type="text"
                                                                                            className="w-full h-full min-h-[36px] p-2 text-center border-0 outline-none ring-0 w-20"
                                                                                            value={vData.filmSize || ''}
                                                                                            onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'filmSize', e.target.value)}
                                                                                            placeholder="Size" />
                                                                                    )}
                                                                                </td>

                                                                                {/* 1st Observation */}
                                                                                {vData.observations.length > 0 ? (
                                                                                    <>
                                                                                        <td className="border border-slate-400 px-2 py-1 text-center bg-slate-50 w-12 font-medium">{vData.observations[0].label}</td>
                                                                                        <td className="border border-slate-400 p-0 align-top bg-white w-20">
                                                                                            <Select
                                                                                                value={vData.observations[0].value || ''}
                                                                                                onValueChange={val => handleObservationValue(assignment.id, sIdx, rIdx, 0, val)}
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
                                                                                        <td rowSpan={obsCount} className="border border-slate-400 p-0 align-top bg-white w-48">
                                                                                            <textarea
                                                                                                className="w-full h-full min-h-[36px] p-2 border-0 outline-none resize-none text-sm"
                                                                                                value={vData.remark !== undefined ? vData.remark : (row.remark || '')}
                                                                                                onChange={e => handleVendorDataChange(assignment.id, sIdx, rIdx, 'remark', e.target.value)}
                                                                                                placeholder="Add remark..."
                                                                                            />
                                                                                        </td>
                                                                                        <td className="border border-slate-400 p-0 bg-white">
                                                                                            <button
                                                                                                onClick={() => handleObservationStatus(assignment.id, sIdx, rIdx, 0, vData.observations[0].status === 'complete' ? 'pending' : 'complete')}
                                                                                                className={`w-full h-full min-h-[32px] text-[10px] font-bold px-1 transition-colors ${vData.observations[0].status === 'complete' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}>
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
                                                                                                className="w-full h-full min-h-[36px] p-2 border-0 outline-none resize-none text-sm"
                                                                                                value={vData.remark !== undefined ? vData.remark : (row.remark || '')}
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
                                                                                        <td className="border border-slate-400 px-2 py-1 text-center bg-slate-50 w-12 font-medium">{obs.label}</td>
                                                                                        <td className="border border-slate-400 p-0 align-top bg-white w-20">
                                                                                            <Select
                                                                                                value={obs.value || ''}
                                                                                                onValueChange={val => handleObservationValue(assignment.id, sIdx, rIdx, obsIdx, val)}
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
                                                                                        <td className="border border-slate-400 p-0 bg-white">
                                                                                            <button
                                                                                                onClick={() => handleObservationStatus(assignment.id, sIdx, rIdx, obsIdx, obs.status === 'complete' ? 'pending' : 'complete')}
                                                                                                className={`w-full h-full min-h-[32px] text-[10px] font-bold px-1 transition-colors ${obs.status === 'complete' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}>
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
                                        <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-end gap-3">
                                            {assignment.submitted ? (
                                                <div className="flex items-center gap-2 text-sm text-green-700">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="font-medium">Submitted</span>
                                                    <span className="text-slate-400">({formatDate(assignment.submitted_at || assignment.submittedAt)})</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => handleSubmitSheet(assignment.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <SendHorizonal className="h-4 w-4" />
                                                    Submit to Company
                                                </Button>
                                            )}
                                        </div>
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
