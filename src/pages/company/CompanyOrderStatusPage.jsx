import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, ChevronDown, ChevronUp, CheckCircle2, CircleDot } from 'lucide-react';

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

    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const loadData = () => {
        const all = getAssignments();
        // Show only accepted orders that have sections
        const accepted = all.filter((a) => a.status === 'accepted');
        setAssignments(accepted);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-900">Order Status</h1>
                </div>
                <p className="text-slate-500">Track section-level progress of accepted orders</p>
            </div>

            {/* Orders */}
            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center text-slate-500">
                            <Activity className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-medium">No accepted orders to track.</p>
                            <p className="text-sm mt-1">Accepted orders will appear here with section-level status.</p>
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
                        const completedCount = sectionStatuses.filter((s) => s === 'complete').length;
                        const totalSections = sectionStatuses.length;
                        const allComplete = totalSections > 0 && completedCount === totalSections;

                        return (
                            <Card key={assignment.id} className="overflow-hidden">
                                {/* Summary Row */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded flex items-center justify-center ${allComplete ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {allComplete ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
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
                                        {/* Progress bar */}
                                        {totalSections > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${allComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${(completedCount / totalSections) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{completedCount}/{totalSections}</span>
                                            </div>
                                        )}
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${allComplete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {allComplete ? 'All Complete' : 'In Progress'}
                                        </span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Section Status List */}
                                {isExpanded && (
                                    <div className="border-t px-4 py-4">
                                        {/* Sheet Info Summary */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-slate-50 rounded-lg">
                                            <div><span className="text-slate-500">Job No:</span> <span className="font-medium">{fd.jobNo}</span></div>
                                            <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(fd.date)}</span></div>
                                            <div><span className="text-slate-500">RS No:</span> <span className="font-medium">{fd.rsNo || '—'}</span></div>
                                            <div><span className="text-slate-500">Technique:</span> <span className="font-medium">{fd.technique || '—'}</span></div>
                                        </div>

                                        {/* Sections Status Table */}
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Section Status</h4>
                                        {sections.length === 0 ? (
                                            <p className="text-sm text-slate-400">No sections in this sheet.</p>
                                        ) : (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="text-left px-4 py-2 font-medium text-slate-700 border-b">#</th>
                                                            <th className="text-left px-4 py-2 font-medium text-slate-700 border-b">Serial No</th>
                                                            <th className="text-left px-4 py-2 font-medium text-slate-700 border-b">Rows</th>
                                                            <th className="text-left px-4 py-2 font-medium text-slate-700 border-b">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sections.map((section, sIdx) => {
                                                            const sStatus = sectionStatuses[sIdx] || 'pending';
                                                            return (
                                                                <tr key={sIdx} className="border-b last:border-b-0 hover:bg-slate-50">
                                                                    <td className="px-4 py-3 text-slate-600">{sIdx + 1}</td>
                                                                    <td className="px-4 py-3 font-medium text-slate-800">{section.serialNo || '—'}</td>
                                                                    <td className="px-4 py-3 text-slate-600">{section.rows.length} row(s)</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            {sStatus === 'complete' ? (
                                                                                <>
                                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                        Complete
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <CircleDot className="h-4 w-4 text-amber-500" />
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                                        Pending
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
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
