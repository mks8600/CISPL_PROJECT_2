import { useState, useEffect } from 'react';
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

const SHEETS_KEY = 'crystal_sheets';
const VENDORS_KEY = 'crystal_vendors';
const ASSIGNED_KEY = 'crystal_assigned_sheets';

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

export default function CompanyOrdersPage() {
  const [sheets, setSheets] = useState(getFromStorage(SHEETS_KEY));
  const [vendors, setVendors] = useState(getFromStorage(VENDORS_KEY));
  const [assignedSheets, setAssignedSheets] = useState(getFromStorage(ASSIGNED_KEY));

  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Refresh list on focus (in case sheets/vendors were updated in another tab)
  useEffect(() => {
    const onFocus = () => {
      setSheets(getFromStorage(SHEETS_KEY));
      setVendors(getFromStorage(VENDORS_KEY));
      setAssignedSheets(getFromStorage(ASSIGNED_KEY));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleAssign = () => {
    if (!selectedSheetId || !selectedVendorId) {
      toast.error('Please select both a sheet and a vendor.');
      return;
    }

    const sheet = sheets.find((s) => s.id === selectedSheetId);
    const vendor = vendors.find((v) => v.id === selectedVendorId);

    if (!sheet || !vendor) {
      toast.error('Invalid selection.');
      return;
    }

    const assignment = {
      id: `assign-${Date.now()}`,
      sheetId: sheet.id,
      sheet: sheet,
      vendorId: vendor.id,
      vendorNo: vendor.vendorNo,
      vendorName: vendor.vendorName,
      status: 'pending', // pending | accepted | declined
      assignedAt: new Date().toISOString(),
    };

    const updated = [assignment, ...assignedSheets];
    localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));
    setAssignedSheets(updated);
    setSelectedSheetId('');
    setSelectedVendorId('');
    toast.success(`Sheet assigned to ${vendor.vendorName}!`);
  };

  const handleDeleteAssignment = (assignId) => {
    const updated = assignedSheets.filter((a) => a.id !== assignId);
    localStorage.setItem(ASSIGNED_KEY, JSON.stringify(updated));
    setAssignedSheets(updated);
    toast.success('Assignment removed.');
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
              <Select value={selectedSheetId} onValueChange={setSelectedSheetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved sheet..." />
                </SelectTrigger>
                <SelectContent>
                  {sheets.length === 0 ? (
                    <SelectItem value="_none" disabled>No saved sheets</SelectItem>
                  ) : (
                    sheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.id}>
                        {sheet.formData.jobNo} — {formatDate(sheet.formData.date)}
                        {sheet.formData.rsNo && ` (RS: ${sheet.formData.rsNo})`}
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
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendorNo} — {vendor.vendorName}
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
        </CardContent>
      </Card>

      {/* Assigned Sheets List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Orders</CardTitle>
          <CardDescription>All sheets assigned to vendors</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedSheets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No orders assigned yet.</p>
              <p className="text-sm">Select a sheet and vendor above to create an assignment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedSheets.map((assignment) => (
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
                      <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {assignment.sheet.formData.jobNo}
                          <span className="font-normal text-slate-500 ml-2">— {formatDate(assignment.sheet.formData.date)}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                          Vendor: <span className="font-medium text-slate-700">{assignment.vendorName}</span> ({assignment.vendorNo})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(assignment.status)}
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {formatDate(assignment.assignedAt)}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div><span className="text-slate-500">RS No:</span> <span className="font-medium">{assignment.sheet.formData.rsNo || '—'}</span></div>
                        <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(assignment.sheet.formData.date)}</span></div>
                        <div><span className="text-slate-500">Job No:</span> <span className="font-medium">{assignment.sheet.formData.jobNo}</span></div>
                        <div><span className="text-slate-500">Radiation Source:</span> <span className="font-medium">{assignment.sheet.formData.radiationSource || '—'}</span></div>
                        <div><span className="text-slate-500">X Ray:</span> <span className="font-medium">{assignment.sheet.formData.xRay || '—'}</span></div>
                        <div><span className="text-slate-500">Technique:</span> <span className="font-medium">{assignment.sheet.formData.technique || '—'}</span></div>
                        <div><span className="text-slate-500">Film Size:</span> <span className="font-medium">{assignment.sheet.formData.filmSize || '—'}</span></div>
                        <div><span className="text-slate-500">Base Material:</span> <span className="font-medium">{assignment.sheet.formData.baseMaterial || '—'}</span></div>
                      </div>
                      {assignment.sheet.sections && assignment.sheet.sections.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Sections ({assignment.sheet.sections.length})</h4>
                          {assignment.sheet.sections.map((section, i) => (
                            <div key={i} className="text-sm text-slate-600 mt-1">
                              Serial No: <span className="font-medium">{section.serialNo || '—'}</span> — {section.rows.length} row(s)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
