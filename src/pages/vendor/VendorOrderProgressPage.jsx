import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ChevronDown, ChevronUp, Clock, CheckCircle2, CircleDot, SendHorizonal, RotateCcw, Wrench, Check } from 'lucide-react';
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

export default function VendorOrderProgressPage() {
    const { user } = useAuth();
    const [acceptedOrders, setAcceptedOrders] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    const loadOrders = () => {
        const all = getAssignments();
        const accepted = all.filter(
            (a) => a.vendorNo === user?.vendorId && a.status === 'accepted'
        );
        setAcceptedOrders(accepted);
    };

    useEffect(() => {
        loadOrders();
        const onFocus = () => loadOrders();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user]);

    const handleSectionStatus = (assignmentId, sectionIndex, newStatus) => {
        const all = getAssignments();
        const updated = all.map((a) => {
            if (a.id === assignmentId) {
                const sectionStatuses = a.sectionStatuses ? [...a.sectionStatuses] : a.sheet.sections.map(() => 'pending');
                sectionStatuses[sectionIndex] = newStatus;
                return { ...a, sectionStatuses };
            }
            return a;
        });
        localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));
        const mine = updated.filter(
            (a) => a.vendorNo === user?.vendorId && a.status === 'accepted'
        );
        setAcceptedOrders(mine);
        toast.success(`Section marked as ${newStatus}`);
    };

    const handleSubmitSheet = (assignmentId) => {
        const all = getAssignments();
        const updated = all.map((a) => {
            if (a.id === assignmentId) {
                return { ...a, submitted: true, submittedAt: new Date().toISOString() };
            }
            return a;
        });
        localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));
        const mine = updated.filter(
            (a) => a.vendorNo === user?.vendorId && a.status === 'accepted'
        );
        setAcceptedOrders(mine);
        toast.success('Sheet submitted to company!');
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
                        const sectionStatuses = assignment.sectionStatuses || assignment.sheet.sections.map(() => 'pending');
                        const completedCount = sectionStatuses.filter((s) => s === 'complete').length;
                        const totalSections = sectionStatuses.length;

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
                                                <span>Accepted: {formatDate(assignment.respondedAt)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">
                                            {completedCount}/{totalSections} Complete
                                        </span>
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
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">radiation source.:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.radiationSource || '—'}</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">X ray:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.xRay || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Job no.:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.jobNo || '—'}</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">weld reinforcement:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.weldReinforcement || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Base material:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.baseMaterial || '—'}</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Base metal:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.baseMetal || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">QI location:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">
                                                            {fd.qiLocation || '—'}
                                                            {fd.filmSide && <span className="ml-3 text-slate-500">film side: {fd.filmSide}</span>}
                                                        </td>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">IQI type:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.iqiType || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Technique:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.technique || '—'}</td>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Film size:</td>
                                                        <td className="border border-slate-400 px-3 py-1.5">{fd.filmSize || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">note:</td>
                                                        <td colSpan={3} className="border border-slate-400 px-3 py-1.5">{fd.note || '—'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Detail Sections with Status Toggle */}
                                        {assignment.sheet.sections && assignment.sheet.sections.length > 0 && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {assignment.sheet.sections.map((section, sIdx) => {
                                                    const sStatus = sectionStatuses[sIdx] || 'pending';
                                                    const reviewStatuses = assignment.reviewStatuses || assignment.sheet.sections.map(() => null);
                                                    const reviewDescriptions = assignment.reviewDescriptions || assignment.sheet.sections.map(() => '');
                                                    const rStatus = reviewStatuses[sIdx];
                                                    const rDesc = reviewDescriptions[sIdx] || '';
                                                    return (
                                                        <table key={sIdx} className="w-full border-collapse border border-slate-400 text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-slate-50 w-[15%]">Serial No:</th>
                                                                    <th colSpan={3} className="border border-slate-400 px-3 py-1.5 text-left font-medium">{section.serialNo || '—'}</th>
                                                                    <th colSpan={2} className="border border-slate-400 px-3 py-1.5 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {sStatus === 'pending' ? (
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={(e) => { e.stopPropagation(); handleSectionStatus(assignment.id, sIdx, 'complete'); }}
                                                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 gap-1"
                                                                                >
                                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                    Mark Complete
                                                                                </Button>
                                                                            ) : (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={(e) => { e.stopPropagation(); handleSectionStatus(assignment.id, sIdx, 'pending'); }}
                                                                                    className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs h-7 gap-1"
                                                                                >
                                                                                    <CircleDot className="h-3.5 w-3.5" />
                                                                                    Mark Pending
                                                                                </Button>
                                                                            )}
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sStatus === 'complete' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                                                                }`}>
                                                                                {sStatus === 'complete' ? 'Complete' : 'Pending'}
                                                                            </span>
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                {/* Company Review Badge Row */}
                                                                <tr>
                                                                    <th colSpan={6} className={`border border-slate-400 px-3 py-1.5 text-left text-xs ${
                                                                        rStatus === 'ok' ? 'bg-green-50' :
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
                                                                    <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Job/Weld Description</th>
                                                                    <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Spot Nos</th>
                                                                    <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Observation</th>
                                                                    <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Film Size</th>
                                                                    <th colSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Result</th>
                                                                </tr>
                                                                <tr>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">knes</th>
                                                                    <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Client</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {section.rows.map((row, rIdx) => (
                                                                    <tr key={rIdx}>
                                                                        <td className="border border-slate-400 px-3 py-1.5">{row.jobWeldDescription || '—'}</td>
                                                                        <td className="border border-slate-400 px-3 py-1.5">{row.spotNos || '—'}</td>
                                                                        <td className="border border-slate-400 px-3 py-1.5">{row.observation || '—'}</td>
                                                                        <td className="border border-slate-400 px-3 py-1.5">{row.filmSize || '—'}</td>
                                                                        <td className="border border-slate-400 px-3 py-1.5">{row.knes || '—'}</td>
                                                                        <td className="border border-slate-400 px-3 py-1.5">{row.client || '—'}</td>
                                                                    </tr>
                                                                ))}
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
                                                    <span className="text-slate-400">({formatDate(assignment.submittedAt)})</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => handleSubmitSheet(assignment.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
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
