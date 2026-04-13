import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, Save, FolderOpen, FilePlus, Clock, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

import { sheetsApi, jobsApi } from '@/lib/api/client';

function createEmptySection(initialSerial = '') {
  return {
    id: Date.now(),
    serialNo: initialSerial,
    rows: [
      { jobWeldDescription: '', remark: '' },
    ],
  };
}

function getEmptyFormData() {
  return {
    rsNo: '',
    date: '',
    jobNo: '',
    descriptionTagNo: '',
    offeredBy: 'CISPL',
    baseMaterial: '',
    baseMetal: '',
    qiLocation: '',
    filmSide: '',
    iqiType: '',
    technique: '',
  };
}



export default function CreateOrderPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(getEmptyFormData());
  const [sections, setSections] = useState([createEmptySection('1')]);
  const [savedSheets, setSavedSheets] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [showSavedSheets, setShowSavedSheets] = useState(false);
  const [jobsList, setJobsList] = useState([]);

  // Data isolation: load this company's sheets and jobs
  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [sheetsRes, jobsRes] = await Promise.all([
          sheetsApi.list(),
          jobsApi.list()
        ]);
        setSavedSheets(sheetsRes);
        setJobsList(jobsRes);
      } catch (err) {
        toast.error('Failed to load init data');
      }
    };
    loadInitData();
  }, [user?.companyId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSectionChange = (sectionIndex, field, value) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex] = { ...updated[sectionIndex], [field]: value };
      return updated;
    });
  };

  const handleRowChange = (sectionIndex, rowIndex, field, value) => {
    setSections((prev) => {
      const updated = [...prev];
      const rows = [...updated[sectionIndex].rows];
      rows[rowIndex] = { ...rows[rowIndex], [field]: value };
      updated[sectionIndex] = { ...updated[sectionIndex], rows };
      return updated;
    });
  };

  const addRowToSection = (sectionIndex) => {
    setSections((prev) => {
      const updated = [...prev];
      const rows = [...updated[sectionIndex].rows, { jobWeldDescription: '', remark: '' }];
      updated[sectionIndex] = { ...updated[sectionIndex], rows };
      return updated;
    });
  };

  const removeRow = (sectionIndex, rowIndex) => {
    setSections((prev) => {
      const updated = [...prev];
      if (updated[sectionIndex].rows.length <= 1) return prev;
      const rows = updated[sectionIndex].rows.filter((_, i) => i !== rowIndex);
      updated[sectionIndex] = { ...updated[sectionIndex], rows };
      return updated;
    });
  };

  const addSection = () => {
    setSections((prev) => {
      let nextSerialStr = (prev.length + 1).toString();
      if (prev.length > 0) {
        const lastSerial = prev[prev.length - 1].serialNo;
        if (lastSerial) {
          const match = lastSerial.match(/^(.*?)(\d+)$/);
          if (match) {
            nextSerialStr = match[1] + (parseInt(match[2], 10) + 1);
          } else if (!isNaN(parseInt(lastSerial))) {
            nextSerialStr = (parseInt(lastSerial) + 1).toString();
          }
        }
      }
      return [...prev, createEmptySection(nextSerialStr)];
    });
  };

  const removeSection = (sectionIndex) => {
    setSections((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, i) => i !== sectionIndex);
      return filtered.map((sec, idx) => {
        const match = sec.serialNo.match(/^(.*?)(\d+)$/);
        if (match) {
          return { ...sec, serialNo: match[1] + (idx + 1) };
        } else if (!isNaN(parseInt(sec.serialNo))) {
          return { ...sec, serialNo: (idx + 1).toString() };
        }
        return { ...sec, serialNo: (idx + 1).toString() };
      });
    });
  };


  // ===== Save / Load / New Sheet Logic =====

  const handleSaveSheet = async () => {
    if (!formData.date || !formData.jobNo) {
      toast.error('Please fill in both Date and Job No. before saving.');
      return;
    }

    const payload = {
      formData,
      sections,
    };

    try {
      if (activeSheetId) {
        const res = await sheetsApi.update(activeSheetId, payload);
        toast.success('Sheet updated successfully!');
        setSavedSheets(prev => prev.map(s => s.id === activeSheetId ? res : s));
      } else {
        const res = await sheetsApi.create(payload);
        toast.success('Sheet created successfully!');
        setSavedSheets(prev => [res, ...prev]);
        setActiveSheetId(res.id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save sheet');
    }
  };

  const handleLoadSheet = (sheet) => {
    setFormData(sheet.form_data || sheet.formData || getEmptyFormData());
    setSections(sheet.sections || [createEmptySection('1')]);
    setActiveSheetId(sheet.id);
    setShowSavedSheets(false);
    toast.success(`Loaded sheet: ${(sheet.form_data || sheet.formData).jobNo}`);
  };

  const handleNewSheet = () => {
    setFormData(getEmptyFormData());
    setSections([createEmptySection('1')]);
    setActiveSheetId(null);
  };

  const handleDeleteSheet = async (e, sheetId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this sheet?')) return;
    try {
      await sheetsApi.delete(sheetId);
      setSavedSheets(prev => prev.filter((s) => s.id !== sheetId));
      if (activeSheetId === sheetId) {
        setActiveSheetId(null);
      }
      toast.success('Sheet deleted!');
    } catch (err) {
      toast.error('Failed to delete sheet');
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const inputClass = "border-0 shadow-none h-8 rounded-none focus-visible:ring-0 px-1";

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* ===== Toolbar: New / Save / Saved Sheets ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewSheet}
            className="gap-1.5"
          >
            <FilePlus className="h-4 w-4" />
            New Sheet
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveSheet}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save Sheet
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSavedSheets(!showSavedSheets)}
          className="gap-1.5"
        >
          <FolderOpen className="h-4 w-4" />
          Saved Sheets ({savedSheets.length})
        </Button>
      </div>

      {/* Active sheet indicator */}
      {activeSheetId && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 text-sm text-blue-700 flex items-center gap-2">
          <Save className="h-3.5 w-3.5" />
          Editing: <strong>{formData.jobNo}</strong> — {formatDisplayDate(formData.date)}
        </div>
      )}

      {/* ===== Saved Sheets Panel ===== */}
      {showSavedSheets && (
        <div className="bg-white border border-slate-300 rounded-lg shadow-md p-4 space-y-2">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Saved Sheets</h3>
          {savedSheets.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No saved sheets yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {savedSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  onClick={() => handleLoadSheet(sheet)}
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${activeSheetId === sheet.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{(sheet.form_data || sheet.formData).jobNo}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDisplayDate((sheet.form_data || sheet.formData).date)}</span>
                        {(sheet.form_data || sheet.formData).rsNo && <span>• RS: {(sheet.form_data || sheet.formData).rsNo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDisplayDate(sheet.created_at || sheet.savedAt)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteSheet(e, sheet.id)}
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Radiographic Requisition Sheet Header ===== */}
      <table className="w-full border-collapse border border-slate-400 text-sm">
        <thead>
          <tr>
            <th
              colSpan={4}
              className="border border-slate-400 bg-slate-100 px-3 py-2 text-center font-semibold text-slate-800"
            >
              Radiographic requisition sheet
            </th>
          </tr>
        </thead>
        <tbody>
          {/* RS NO. | Date */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-bold text-yellow-900 w-[15%] bg-yellow-200">RS NO.:</td>
            <td className="border border-slate-400 px-2 py-1 w-[35%]">
              <Input value={formData.rsNo} onChange={(e) => handleChange('rsNo', e.target.value)} className={inputClass} />
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-bold text-yellow-900 w-[15%] bg-yellow-200">Date:</td>
            <td className="border border-slate-400 px-2 py-1 w-[35%]">
              <Input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* Job no. */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-bold text-yellow-900 bg-yellow-200">Job no.:</td>
            <td colSpan={3} className="border border-slate-400 px-2 py-1">
              {jobsList.length > 0 ? (
                <Select value={formData.jobNo} onValueChange={(value) => handleChange('jobNo', value)}>
                  <SelectTrigger className="border-0 shadow-none h-8 rounded-none focus:ring-0 px-1 w-full md:w-1/2">
                    <SelectValue placeholder="Select job no." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobsList.map((job) => (
                      <SelectItem key={job.id} value={job.job_no || job.jobNo}>
                        {job.job_no || job.jobNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formData.jobNo} onChange={(e) => handleChange('jobNo', e.target.value)} className={`${inputClass} w-full md:w-1/2`} placeholder="No jobs available" />
              )}
            </td>
          </tr>
          {/* Description / Tag no */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-bold text-yellow-900 bg-yellow-200">Description / Tag no:</td>
            <td colSpan={3} className="border border-slate-400 px-2 py-1">
              <Input
                value={formData.descriptionTagNo || ''}
                onChange={(e) => handleChange('descriptionTagNo', e.target.value)}
                className={`${inputClass} w-full`}
                placeholder="Enter description or tag no."
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== Detail Sections ===== */}
      {sections.map((section, sectionIndex) => (
        <div key={section.id} className="relative">
          <table className="w-full border-collapse border border-slate-400 text-sm">
            <thead>
              {/* Serial No row */}
              <tr>
                <th colSpan={3} className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-slate-50">
                  Serial No: {sectionIndex + 1}
                </th>
              </tr>
              {/* Column headers */}
              <tr>
                <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100 w-[70%]">
                  Job/Weld Description
                </th>
                <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Remark
                </th>
                <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100 w-10">
                </th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-slate-400 px-2 py-1">
                    <Input value={row.jobWeldDescription} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'jobWeldDescription', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-slate-400 px-2 py-1">
                    <Input value={row.remark || ''} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'remark', e.target.value)} className={inputClass} placeholder="Add a remark..." />
                  </td>
                  <td className="border border-slate-400 px-2 py-1 text-center font-medium text-slate-700 bg-slate-50">
                    {section.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(sectionIndex, rowIndex)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row button */}
          <div className="flex justify-end mt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addRowToSection(sectionIndex)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs h-7"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Row
            </Button>
          </div>
        </div>
      ))}

      {/* ===== Offered By ===== */}
      <div className="flex justify-start pt-2">
        <table className="w-full sm:w-1/2 md:w-1/3 border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border border-slate-400 px-3 py-1.5 font-bold text-center text-yellow-900 bg-yellow-200 w-[40%]">
                OFFERED BY
              </td>
              <td className="border border-slate-400 px-2 py-1 bg-white">
                <Select value={formData.offeredBy || 'CISPL'} onValueChange={(val) => handleChange('offeredBy', val)}>
                  <SelectTrigger className="border-0 shadow-none h-8 rounded-none focus:ring-0 px-1 w-full font-semibold">
                    <SelectValue placeholder="Select offered by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CISPL">CISPL</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== Bottom Buttons: Add Section + Save ===== */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={addSection}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Section
        </Button>
        <Button
          type="button"
          onClick={handleSaveSheet}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Sheet
        </Button>
      </div>
    </div>
  );
}
