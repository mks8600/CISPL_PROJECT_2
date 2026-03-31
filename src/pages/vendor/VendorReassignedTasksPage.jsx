import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Check, X, ChevronDown, ChevronUp, Clock, RotateCcw, Wrench } from 'lucide-react';
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

export default function VendorReassignedTasksPage() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        loadOrders();
        const onFocus = () => loadOrders();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user]);

    const loadOrders = () => {
        const all = getAssignments();
        // Filter by vendor — match vendorNo to user.vendorId, and MUST be reassigned
        const mine = all.filter((a) => a.vendorNo === user?.vendorId && a.reassignedFrom);
        setAssignments(mine);
    };

    const handleUpdateStatus = (assignmentId, newStatus) => {
        const all = getAssignments();
        const updated = all.map((a) => {
            if (a.id === assignmentId) {
                return { ...a, status: newStatus, respondedAt: new Date().toISOString() };
            }
            return a;
        });
        localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));

        // Refresh local state
        const mine = updated.filter((a) => a.vendorNo === user?.vendorId);
        setAssignments(mine);

        if (newStatus === 'accepted') {
            toast.success('Order accepted!');
        } else {
            toast.info('Order declined.');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-800',
            accepted: 'bg-green-100 text-green-800',
            declined: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Pending',
            accepted: 'Accepted',
            declined: 'Declined',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Package className="h-6 w-6 text-amber-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Reassigned Tasks</h1>
                </div>
                <p className="text-slate-500">View and respond to tasks that have been sent back for retake or repair</p>
            </div>

            {/* Orders List */}
            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-medium">No reassigned tasks found.</p>
                            <p className="text-sm mt-1">Sheets marked for retake or repair will appear here.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => {
                        const fd = assignment.sheet.formData;
                        const isExpanded = expandedId === assignment.id;

                        return (
                            <Card key={assignment.id} className="overflow-hidden">
                                {/* Summary */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded flex items-center justify-center ${assignment.status === 'accepted' ? 'bg-green-50 text-green-600' :
                                                assignment.status === 'declined' ? 'bg-red-50 text-red-600' :
                                                    'bg-amber-50 text-amber-600'
                                            }`}>
                                            {assignment.status === 'accepted' ? <Check className="h-5 w-5" /> :
                                                assignment.status === 'declined' ? <X className="h-5 w-5" /> :
                                                    <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {fd.jobNo}
                                                <span className="font-normal text-slate-500 ml-2">— {formatDate(fd.date)}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                RS No: {fd.rsNo || '—'} • Assigned: {formatDate(assignment.assignedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(assignment.status)}
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Full Sheet Details */}
                                {isExpanded && (
                                    <div className="border-t">
                                        {/* Radiographic Requisition Sheet Header */}
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

                                        {/* Detail Sections */}
                                        {assignment.sheet.sections && assignment.sheet.sections.length > 0 && (() => {
                                            const reviewStatuses = assignment.reviewStatuses || assignment.sheet.sections.map(() => null);
                                            const reviewDescriptions = assignment.reviewDescriptions || assignment.sheet.sections.map(() => '');
                                            const hasReviewIssues = reviewStatuses.some((r) => r === 'retake' || r === 'repair');

                                            return (
                                                <>
                                                    {hasReviewIssues && (
                                                        <div className="mx-4 mb-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-800">
                                                            <span className="font-semibold">⚠ Company Review:</span> Some sections have been marked for retake or repair. See details below.
                                                        </div>
                                                    )}
                                                    <div className="px-4 pb-4 space-y-3">
                                                        {assignment.sheet.sections.map((section, sIdx) => {
                                                            const rStatus = reviewStatuses[sIdx];
                                                            const rDesc = reviewDescriptions[sIdx] || '';
                                                            return (
                                                                <table key={sIdx} className="w-full border-collapse border border-slate-400 text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-slate-50 w-[15%]">
                                                                                Serial No:
                                                                            </th>
                                                                            <th className="border border-slate-400 px-3 py-1.5 text-left font-medium">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span>{section.serialNo || '—'}</span>
                                                                                    <div className="flex items-center gap-2">
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
                                                                                        {rStatus === 'ok' && (
                                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                                <Check className="h-3 w-3" /> OK
                                                                                            </span>
                                                                                        )}
                                                                                        {!rStatus && (
                                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                                                                Not Reviewed
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </th>
                                                                        </tr>
                                                                        {rDesc && (rStatus === 'retake' || rStatus === 'repair') && (
                                                                            <tr>
                                                                                <td colSpan={2} className={`border border-slate-400 px-3 py-1.5 text-sm ${rStatus === 'retake' ? 'bg-orange-50 text-orange-800' : 'bg-red-50 text-red-800'}`}>
                                                                                    <span className="font-medium">Reason:</span> {rDesc}
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                        <tr>
                                                                            <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100 w-[70%]">Job/Weld Description</th>
                                                                            <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Remark</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {section.rows.map((row, rIdx) => (
                                                                            <tr key={rIdx}>
                                                                                <td className="border border-slate-400 px-3 py-1.5 font-semibold text-blue-900 bg-blue-50/50 break-words whitespace-pre-wrap min-w-[150px] border-l-4 border-l-blue-500">{row.jobWeldDescription || '—'}</td>
                                                                                <td className="border border-slate-400 px-3 py-1.5">{row.remark || '—'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}

                                        {/* Accept / Decline Buttons */}
                                        {assignment.status === 'pending' && (
                                            <div className="border-t px-4 py-3 bg-slate-50 flex items-center justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(assignment.id, 'declined')}
                                                    className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 gap-1.5"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Decline
                                                </Button>
                                                <Button
                                                    onClick={() => handleUpdateStatus(assignment.id, 'accepted')}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Accept
                                                </Button>
                                            </div>
                                        )}

                                        {/* Already responded */}
                                        {assignment.status !== 'pending' && assignment.respondedAt && (
                                            <div className="border-t px-4 py-3 bg-slate-50 text-sm text-slate-500">
                                                {assignment.status === 'accepted' ? 'Accepted' : 'Declined'} on {formatDate(assignment.respondedAt)}
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
