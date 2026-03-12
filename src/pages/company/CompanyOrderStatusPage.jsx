import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        const accepted = all.filter((a) => a.status === 'accepted' && a.submitted === true);
        setAssignments(accepted);
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
        setAssignments(updated.filter((a) => a.status === 'accepted' && a.submitted === true));
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
                        const completedCount = sectionStatuses.filter((s) => s === 'complete').length;
                        const totalSections = sectionStatuses.length;
                        const reviewedCount = reviewStatuses.filter((s) => s !== null).length;

                        return (
                            <Card key={assignment.id} className="overflow-hidden">
                                {/* Summary Row */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded flex items-center justify-center ${reviewedCount === totalSections && totalSections > 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {reviewedCount === totalSections && totalSections > 0 ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
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
                                        {totalSections > 0 && (
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {reviewedCount}/{totalSections} Reviewed
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Section Review */}
                                {isExpanded && (
                                    <div className="border-t px-4 py-4">
                                        {/* Sheet Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-slate-50 rounded-lg">
                                            <div><span className="text-slate-500">Job No:</span> <span className="font-medium">{fd.jobNo}</span></div>
                                            <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(fd.date)}</span></div>
                                            <div><span className="text-slate-500">RS No:</span> <span className="font-medium">{fd.rsNo || '—'}</span></div>
                                            <div><span className="text-slate-500">Technique:</span> <span className="font-medium">{fd.technique || '—'}</span></div>
                                        </div>

                                        {/* Sections */}
                                        {sections.length === 0 ? (
                                            <p className="text-sm text-slate-400">No sections in this sheet.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {sections.map((section, sIdx) => {
                                                    const sStatus = sectionStatuses[sIdx] || 'pending';
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
                                                            <table className="w-full border-collapse text-sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="border-t border-b border-slate-300 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Job/Weld Description</th>
                                                                        <th className="border-t border-b border-slate-300 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Spot Nos</th>
                                                                        <th className="border-t border-b border-slate-300 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Observation</th>
                                                                        <th className="border-t border-b border-slate-300 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Film Size</th>
                                                                        <th className="border-t border-b border-slate-300 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">knes</th>
                                                                        <th className="border-t border-b border-slate-300 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Client</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {section.rows.map((row, rIdx) => (
                                                                        <tr key={rIdx} className="border-b last:border-b-0">
                                                                            <td className="px-3 py-1.5 border-r border-slate-200">{row.jobWeldDescription || '—'}</td>
                                                                            <td className="px-3 py-1.5 border-r border-slate-200">{row.spotNos || '—'}</td>
                                                                            <td className="px-3 py-1.5 border-r border-slate-200">{row.observation || '—'}</td>
                                                                            <td className="px-3 py-1.5 border-r border-slate-200">{row.filmSize || '—'}</td>
                                                                            <td className="px-3 py-1.5 border-r border-slate-200">{row.knes || '—'}</td>
                                                                            <td className="px-3 py-1.5">{row.client || '—'}</td>
                                                                        </tr>
                                                                    ))}
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
