import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

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

/**
 * Collect all resolved sections for an assignment, including sections
 * that were reassigned and completed in child assignments.
 * Returns an array of { section, reviewStatus } for all fully-resolved sections.
 * Deduplicates by serialNo to handle complex reassignment chains.
 */
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
                return; // Skip, will get it from child
            }
            // Only add if we haven't seen this serial number yet
            if (section.serialNo && !seenSerials.has(section.serialNo)) {
                seenSerials.add(section.serialNo);
                result.push({ section, reviewStatus: reviewStatuses[idx] });
            }
        });

        // Traverse children
        const children = allAssignments.filter((a) => a.reassignedFrom === currentId);
        for (const child of children) {
            traverse(child.id);
        }
    }

    traverse(assignmentId);
    
    // Sort by serial number so they appear in order (e.g., 1, 2, 3)
    return result.sort((a, b) => {
        const numA = parseInt(a.section.serialNo) || 0;
        const numB = parseInt(b.section.serialNo) || 0;
        return numA - numB;
    });
}

/**
 * Check if an entire assignment chain (original + all descendants) is fully complete.
 * All sections across all assignments must be complete + reviewed OK.
 */
function isChainFullyComplete(assignmentId, allAssignments) {
    const assignment = allAssignments.find((a) => a.id === assignmentId);
    if (!assignment) return false;
    
    // The total expected sections is the number of sections on the original root sheet
    const expectedLength = (assignment.sheet.sections || []).length;
    
    const resolved = collectAllSections(assignmentId, allAssignments);
    if (resolved.length !== expectedLength) return false;
    
    return resolved.every((r) => r.reviewStatus === 'ok');
}

export default function CompanyCompletedWorkPage() {
    const [completedItems, setCompletedItems] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        loadData();
        const onFocus = () => loadData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const loadData = () => {
        const all = getAssignments();

        // Find "root" assignments (ones that are NOT reassigned from another)
        // that have their entire chain fully complete
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

        setCompletedItems(completed);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Completed Works</h1>
                </div>
                <p className="text-slate-500">View all fully completed and reviewed sheets</p>
            </div>

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
            ) : (
                <div className="space-y-4">
                    {completedItems.map((assignment) => {
                        const fd = assignment.sheet.formData;
                        const isExpanded = expandedId === assignment.id;
                        const allSections = assignment.resolvedSections || [];

                        return (
                            <Card key={assignment.id} className="overflow-hidden border-green-200">
                                {/* Summary */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-green-50/50 transition-colors"
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
                                                Vendor: <span className="font-medium text-slate-700">{assignment.vendorName}</span> ({assignment.vendorNo})
                                                {fd.rsNo && <span className="ml-2">• RS: {fd.rsNo}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle2 className="h-3 w-3" /> All Reviewed OK
                                        </span>
                                        <span className="text-xs text-slate-400">{allSections.length} section(s)</span>
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded — Full Details */}
                                {isExpanded && (
                                    <div className="border-t">
                                        {/* Sheet Info */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-green-50 rounded-lg">
                                                <div><span className="text-slate-500">Job No:</span> <span className="font-medium">{fd.jobNo}</span></div>
                                                <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(fd.date)}</span></div>
                                                <div><span className="text-slate-500">Vendor:</span> <span className="font-medium">{assignment.vendorName}</span></div>
                                                <div><span className="text-slate-500">RS No:</span> <span className="font-medium">{fd.rsNo || '—'}</span></div>
                                                <div><span className="text-slate-500">Technique:</span> <span className="font-medium">{fd.technique || '—'}</span></div>
                                                <div><span className="text-slate-500">Radiation Source:</span> <span className="font-medium">{fd.radiationSource || '—'}</span></div>
                                                <div><span className="text-slate-500">X Ray:</span> <span className="font-medium">{fd.xRay || '—'}</span></div>
                                                <div><span className="text-slate-500">Film Size:</span> <span className="font-medium">{fd.filmSize || '—'}</span></div>
                                                <div><span className="text-slate-500">Base Material:</span> <span className="font-medium">{fd.baseMaterial || '—'}</span></div>
                                            </div>
                                        </div>

                                        {/* All Resolved Sections */}
                                        <div className="px-4 pb-4 space-y-3">
                                            {allSections.map((item, sIdx) => (
                                                <table key={sIdx} className="w-full border-collapse border border-slate-400 text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-green-50 w-[15%]">Serial No:</th>
                                                            <th colSpan={2} className="border border-slate-400 px-3 py-1.5 text-left font-medium">{item.section.serialNo || '—'}</th>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-right">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    <CheckCircle2 className="h-3 w-3" /> OK
                                                                </span>
                                                            </th>
                                                        </tr>
                                                        <tr>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Job/Weld Description</th>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Spot Nos</th>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Observation</th>
                                                            <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">Film Size</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.section.rows.map((row, rIdx) => (
                                                            <tr key={rIdx}>
                                                                <td className="border border-slate-400 px-3 py-1.5 font-semibold text-blue-900 bg-blue-50/50 break-words whitespace-pre-wrap min-w-[150px] border-l-4 border-l-blue-500">{row.jobWeldDescription || '—'}</td>
                                                                <td className="border border-slate-400 px-3 py-1.5">{row.spotNos || '—'}</td>
                                                                <td className="border border-slate-400 px-3 py-1.5">{row.observation || '—'}</td>
                                                                <td className="border border-slate-400 px-3 py-1.5">{row.filmSize || '—'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ))}
                                        </div>

                                        {/* Submitted info */}
                                        {assignment.submittedAt && (
                                            <div className="border-t px-4 py-3 bg-green-50 text-sm text-green-700 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>Submitted on {formatDate(assignment.submittedAt)}</span>
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
