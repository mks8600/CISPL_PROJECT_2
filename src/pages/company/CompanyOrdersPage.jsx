import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { ClipboardList, Send, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { sheetsApi, globalVendorsApi, assignmentsApi } from '@/lib/api/client';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CompanyOrdersPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assignedSheets, setAssignedSheets] = useState([]);

  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);

  // Refresh list on mount and on focus
  useEffect(() => {
    const loadData = async () => {
      try {
        const [sheetsData, vendorsData, assignmentsData] = await Promise.all([
          sheetsApi.list(),
          globalVendorsApi.list(),
          assignmentsApi.list()
        ]);
        setSheets(sheetsData);
        setVendors(vendorsData);
        setAssignedSheets(assignmentsData);
      } catch (err) {
        toast.error('Failed to load data');
      }
    };
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [user?.companyId]);

  const handleAssign = async () => {
    if (!selectedSheetId || !selectedVendorId) {
      toast.error('Please select both a sheet and a vendor.');
      return;
    }

    if (selectedSections.length === 0) {
      toast.error('Please select at least one item (section) to assign.');
      return;
    }

    const sheet = sheets.find((s) => s.id === selectedSheetId);
    const vendor = vendors.find((v) => v.id === selectedVendorId);

    if (!sheet || !vendor) {
      toast.error('Invalid selection.');
      return;
    }

    const filteredSections = (sheet.sections || []).filter((_, idx) => selectedSections.includes(idx));

    try {
      const assignment = await assignmentsApi.create({
        sheetId: sheet.id,
        sheetData: {
          ...sheet,
          sections: filteredSections
        },
        vendorId: vendor.id,
        vendorNo: vendor.vendor_no || vendor.vendorNo,
        vendorName: vendor.vendor_name || vendor.vendorName,
      });

      setAssignedSheets([assignment, ...assignedSheets]);
      setSelectedSheetId('');
      setSelectedVendorId('');
      setSelectedSections([]);
      toast.success(`Assigned ${filteredSections.length} items to ${vendor.vendor_name || vendor.vendorName}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to assign sheet');
    }
  };

  const handleDeleteAssignment = async (assignId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;
    try {
      await assignmentsApi.delete(assignId);
      setAssignedSheets(assignedSheets.filter((a) => a.id !== assignId));
      toast.success('Assignment removed.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete assignment');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const visibleAssignments = assignedSheets.filter((a) => {
    if (a.status !== 'accepted' || !a.submitted) return true;
    const sheetData = a.sheet_data || a.sheet || {};
    const statuses = a.section_statuses || a.sectionStatuses || (sheetData.sections || []).map(() => 'pending');
    const reviewStatuses = a.review_statuses || a.reviewStatuses || (sheetData.sections || []).map(() => null);
    if (!statuses || statuses.length === 0) return true;
    const isCompleted = statuses.every((s, i) => s === 'reassigned' || (s === 'complete' && reviewStatuses[i] === 'ok'));
    return !isCompleted;
  });

  const isSheetFullyCompleted = (sheetId) => {
    const sheet = sheets.find((s) => s.id === sheetId);
    if (!sheet || !sheet.sections) return false;

    const completedSectionsIndices = new Set();
    assignedSheets.forEach((assignment) => {
      if (assignment.sheet_id === sheetId || assignment.sheetId === sheetId) {
        const sheetData = assignment.sheet_data || assignment.sheet || {};
        const sections = sheetData.sections || [];
        const sectionStatuses = assignment.section_statuses || assignment.sectionStatuses || sections.map(() => 'pending');
        const reviewStatuses = assignment.review_statuses || assignment.reviewStatuses || sections.map(() => null);

        sections.forEach((sec, idx) => {
          if (sectionStatuses[idx] === 'complete' && reviewStatuses[idx] === 'ok') {
            const rootIdx = sheet.sections.findIndex(rs => rs.serialNo === sec.serialNo);
            if (rootIdx !== -1) completedSectionsIndices.add(rootIdx);
          }
        });
      }
    });

    const expectedLength = sheet.sections.length;
    return expectedLength > 0 && completedSectionsIndices.size >= expectedLength;
  };

  const availableSheetsList = sheets;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        </div>
        <p className="text-slate-500">Assign saved sheets to vendors</p>
      </div>

      {/* Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Sheet to Vendor</CardTitle>
          <CardDescription>Select a saved requisition sheet and assign it to a vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Sheet Selector */}
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Select Sheet</label>
              <Select value={selectedSheetId} onValueChange={(val) => {
                setSelectedSheetId(val);
                if (val && val !== 'none') {
                  const sheet = sheets.find(s => s.id === val);
                  if (sheet && sheet.sections) {
                    setSelectedSections(sheet.sections.map((_, i) => i));
                  } else {
                    setSelectedSections([]);
                  }
                } else {
                  setSelectedSections([]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved sheet..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSheetsList.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No sheets available
                    </SelectItem>
                  ) : (
                    availableSheetsList.map((sheet) => (
                      <SelectItem key={sheet.id} value={String(sheet.id)}>
                        <span className="font-semibold text-blue-800">RS No: {sheet.form_data?.rsNo || sheet.formData?.rsNo || 'N/A'}</span> — Job: {sheet.form_data?.jobNo || sheet.formData?.jobNo || 'N/A'} ({new Date(sheet.created_at || sheet.createdAt || sheet.form_data?.date || sheet.formData?.date || Date.now()).toLocaleDateString()}) - {sheet.sections?.length || 0} sections
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Selector */}
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Select Vendor</label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="_none" disabled>No vendors available</SelectItem>
                  ) : (
                    vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        {vendor.vendor_no || vendor.vendorNo} — {vendor.vendor_name || vendor.vendorName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Assign Button */}
            <Button
              onClick={handleAssign}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Send className="h-4 w-4" />
              Assign
            </Button>
          </div>

          {/* Sections Selector */}
          {selectedSheetId && selectedSheetId !== 'none' && (
            <div className="mt-6 border-t pt-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select Items (Sections) to Assign</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {sheets.find(s => s.id === selectedSheetId)?.sections?.map((section, idx) => (
                  <label key={idx} className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${selectedSections.includes(idx) ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-slate-50'}`}>
                    <input 
                      type="checkbox" 
                      className="mt-0.5 h-4 w-4 text-blue-600 rounded border-slate-300"
                      checked={selectedSections.includes(idx)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSections(prev => [...prev, idx]);
                        } else {
                          setSelectedSections(prev => prev.filter(i => i !== idx));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        Item {idx + 1} — Serial No: {section.serialNo || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {section.rows?.length || 0} row(s) • Desc: {section.rows?.[0]?.jobWeldDescription || 'None'}
                      </p>
                    </div>
                  </label>
                ))}
                {(!sheets.find(s => s.id === selectedSheetId)?.sections || sheets.find(s => s.id === selectedSheetId)?.sections?.length === 0) && (
                  <p className="text-sm text-slate-500 italic">This sheet has no sections to assign.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Sheets List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Orders</CardTitle>
          <CardDescription>All sheets assigned to vendors</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleAssignments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No orders assigned yet.</p>
              <p className="text-sm">Select a sheet and vendor above to create an assignment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAssignments.map((assignment) => {
                const sheetData = assignment.sheet_data || assignment.sheet || {};
                const formData = sheetData.form_data || sheetData.formData || {};
                return (
                <div
                  key={assignment.id}
                  className="border rounded-lg bg-white overflow-hidden"
                >
                  {/* Summary Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === assignment.id ? null : assignment.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-blue-50 flex shrink-0 items-center justify-center text-blue-600">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                          {formData.rsNo && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded border border-blue-300 shadow-sm">
                              RS NO: {formData.rsNo}
                            </span>
                          )}
                          <span>{formData.jobNo}</span>
                          <span className="font-normal text-slate-500">— {formatDate(formData.date)}</span>
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Vendor: <span className="font-medium text-slate-700">{assignment.vendor_name || assignment.vendorName}</span> ({assignment.vendor_no || assignment.vendorNo})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(assignment.status)}
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {formatDate(assignment.assigned_at || assignment.assignedAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id); }}
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedId === assignment.id ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === assignment.id && (
                    <div className="border-t px-4 py-3 bg-slate-50">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Sheet Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div><span className="text-slate-500">RS No:</span> <span className="font-medium">{formData.rsNo || '—'}</span></div>
                        <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(formData.date)}</span></div>
                        <div><span className="text-slate-500">Job No:</span> <span className="font-medium">{formData.jobNo}</span></div>
                      </div>
                      {sheetData.sections && sheetData.sections.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Sections ({sheetData.sections.length})</h4>
                          <div className="space-y-3">
                            {sheetData.sections.map((section, i) => (
                              <div key={i} className="text-sm text-slate-700 bg-white border rounded-md p-3 shadow-sm">
                                <div className="font-medium flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                                  <span>Serial No: {section.serialNo || '—'}</span>
                                  <span className="text-xs font-normal text-slate-500">{section.rows.length} row(s)</span>
                                </div>
                                <div className="space-y-2">
                                  {section.rows.map((row, rIdx) => (
                                    <div key={rIdx} className="bg-amber-100 text-amber-900 px-3 py-2 rounded-md font-semibold border border-amber-200 shadow-sm flex flex-col gap-0.5">
                                      <div className="flex flex-col gap-2">
                                        <div>
                                          <span className="text-[10px] text-amber-700 uppercase tracking-widest font-bold">Job/Weld Description</span>
                                          <div className="text-sm">{row.jobWeldDescription || '—'}</div>
                                        </div>
                                        {row.remark && (
                                          <div>
                                            <span className="text-[10px] text-amber-700 uppercase tracking-widest font-bold">Remark</span>
                                            <div className="text-sm border-t border-amber-200 pt-1 mt-0.5">{row.remark}</div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
