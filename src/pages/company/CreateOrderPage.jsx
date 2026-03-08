import { useState, useEffect } from 'react';
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

const SHEETS_STORAGE_KEY = 'crystal_sheets';

function createEmptySection() {
  return {
    id: Date.now(),
    serialNo: '',
    rows: [
      { jobWeldDescription: '', spotNos: '', observation: '', filmSize: '', knes: '', client: '' },
    ],
  };
}

function getEmptyFormData() {
  return {
    rsNo: '',
    date: '',
    radiationSource: '',
    xRay: '',
    jobNo: '',
    weldReinforcement: '',
    baseMaterial: '',
    baseMetal: '',
    qiLocation: '',
    filmSide: '',
    iqiType: '',
    technique: '',
    filmSize: '',
    note: '',
  };
}

function getSavedSheets() {
  try {
    const saved = localStorage.getItem(SHEETS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSheetToStorage(sheets) {
  localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(sheets));
}

export default function CreateOrderPage() {
  const [formData, setFormData] = useState(getEmptyFormData());
  const [sections, setSections] = useState([createEmptySection()]);
  const [savedSheets, setSavedSheets] = useState(getSavedSheets());
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [showSavedSheets, setShowSavedSheets] = useState(false);

  // Load jobs from localStorage (same data as Manage Job No page)
  const [jobsList, setJobsList] = useState([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crystal_jobs');
      if (saved) setJobsList(JSON.parse(saved));
    } catch {
      setJobsList([]);
    }
  }, []);

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
      const rows = [...updated[sectionIndex].rows, { jobWeldDescription: '', spotNos: '', observation: '', filmSize: '', knes: '', client: '' }];
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
    setSections((prev) => [...prev, createEmptySection()]);
  };

  const removeSection = (sectionIndex) => {
    setSections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== sectionIndex);
    });
  };


  // ===== Save / Load / New Sheet Logic =====

  const handleSaveSheet = () => {
    if (!formData.date || !formData.jobNo) {
      toast.error('Please fill in both Date and Job No. before saving.');
      return;
    }

    const sheetData = {
      id: activeSheetId || `sheet-${Date.now()}`,
      formData,
      sections,
      savedAt: new Date().toISOString(),
    };

    let updatedSheets;
    if (activeSheetId) {
      // Update existing sheet
      updatedSheets = savedSheets.map((s) => (s.id === activeSheetId ? sheetData : s));
    } else {
      // Check for duplicate (same date + jobNo)
      const duplicate = savedSheets.find(
        (s) => s.formData.date === formData.date && s.formData.jobNo === formData.jobNo
      );
      if (duplicate) {
        // Overwrite the duplicate
        sheetData.id = duplicate.id;
        updatedSheets = savedSheets.map((s) => (s.id === duplicate.id ? sheetData : s));
      } else {
        updatedSheets = [sheetData, ...savedSheets];
      }
    }

    saveSheetToStorage(updatedSheets);
    setSavedSheets(updatedSheets);
    setActiveSheetId(sheetData.id);
    toast.success('Sheet saved successfully!');
  };

  const handleLoadSheet = (sheet) => {
    setFormData(sheet.formData);
    setSections(sheet.sections);
    setActiveSheetId(sheet.id);
    setShowSavedSheets(false);
    toast.success(`Loaded sheet: ${sheet.formData.jobNo} — ${sheet.formData.date}`);
  };

  const handleNewSheet = () => {
    setFormData(getEmptyFormData());
    setSections([createEmptySection()]);
    setActiveSheetId(null);
  };

  const handleDeleteSheet = (e, sheetId) => {
    e.stopPropagation();
    const updatedSheets = savedSheets.filter((s) => s.id !== sheetId);
    saveSheetToStorage(updatedSheets);
    setSavedSheets(updatedSheets);
    if (activeSheetId === sheetId) {
      setActiveSheetId(null);
    }
    toast.success('Sheet deleted!');
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
                      <p className="font-medium text-slate-800 text-sm">{sheet.formData.jobNo}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDisplayDate(sheet.formData.date)}</span>
                        {sheet.formData.rsNo && <span>• RS: {sheet.formData.rsNo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDisplayDate(sheet.savedAt)}
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
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 w-[15%] bg-slate-50">RS NO.:</td>
            <td className="border border-slate-400 px-2 py-1 w-[35%]">
              <Input value={formData.rsNo} onChange={(e) => handleChange('rsNo', e.target.value)} className={inputClass} />
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 w-[15%] bg-slate-50">Date:</td>
            <td className="border border-slate-400 px-2 py-1 w-[35%]">
              <Input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* radiation source | X ray */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">radiation source.:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.radiationSource} onChange={(e) => handleChange('radiationSource', e.target.value)} className={inputClass} />
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">X ray:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.xRay} onChange={(e) => handleChange('xRay', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* Job no. | weld reinforcement */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Job no.:</td>
            <td className="border border-slate-400 px-2 py-1">
              {jobsList.length > 0 ? (
                <Select value={formData.jobNo} onValueChange={(value) => handleChange('jobNo', value)}>
                  <SelectTrigger className="border-0 shadow-none h-8 rounded-none focus:ring-0 px-1">
                    <SelectValue placeholder="Select job no." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobsList.map((job) => (
                      <SelectItem key={job.id} value={job.jobNo}>
                        {job.jobNo} — {job.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formData.jobNo} onChange={(e) => handleChange('jobNo', e.target.value)} className={inputClass} placeholder="No jobs available" />
              )}
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">weld reinforcement:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.weldReinforcement} onChange={(e) => handleChange('weldReinforcement', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* Base material | Base metal */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Base material:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.baseMaterial} onChange={(e) => handleChange('baseMaterial', e.target.value)} className={inputClass} />
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Base metal:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.baseMetal} onChange={(e) => handleChange('baseMetal', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* QI location | film side | IQI type */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">QI location:</td>
            <td className="border border-slate-400 px-2 py-1">
              <div className="flex items-center gap-0">
                <Input value={formData.qiLocation} onChange={(e) => handleChange('qiLocation', e.target.value)} className={`${inputClass} flex-1`} />
                <span className="text-slate-700 font-medium whitespace-nowrap border-l border-slate-400 px-2">film side:</span>
                <Input value={formData.filmSide} onChange={(e) => handleChange('filmSide', e.target.value)} className={`${inputClass} flex-1`} />
              </div>
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">IQI type:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.iqiType} onChange={(e) => handleChange('iqiType', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* Technique | Film size */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Technique:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.technique} onChange={(e) => handleChange('technique', e.target.value)} className={inputClass} />
            </td>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">Film size:</td>
            <td className="border border-slate-400 px-2 py-1">
              <Input value={formData.filmSize} onChange={(e) => handleChange('filmSize', e.target.value)} className={inputClass} />
            </td>
          </tr>
          {/* note */}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-medium text-slate-700 bg-slate-50">note:</td>
            <td colSpan={3} className="border border-slate-400 px-2 py-1">
              <Input value={formData.note} onChange={(e) => handleChange('note', e.target.value)} className={inputClass} />
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
                <th className="border border-slate-400 px-3 py-1.5 text-left font-medium text-slate-700 bg-slate-50 w-[15%]">
                  Serial No:
                </th>
                <th colSpan={5} className="border border-slate-400 px-2 py-1 text-left">
                  <div className="flex items-center justify-between">
                    <Input
                      value={section.serialNo}
                      onChange={(e) => handleSectionChange(sectionIndex, 'serialNo', e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(sectionIndex)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 h-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </th>
              </tr>
              {/* Column headers */}
              <tr>
                <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Job/Weld Description
                </th>
                <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Spot Nos
                </th>
                <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Observation
                </th>
                <th rowSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Film Size
                </th>
                <th colSpan={2} className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Result
                </th>
              </tr>
              <tr>
                <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  knes
                </th>
                <th className="border border-slate-400 px-3 py-1.5 text-center font-medium text-slate-700 bg-slate-100">
                  Client
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
                    <Input value={row.spotNos} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'spotNos', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-slate-400 px-2 py-1">
                    <Input value={row.observation} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'observation', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-slate-400 px-2 py-1">
                    <Input value={row.filmSize} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'filmSize', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-slate-400 px-2 py-1">
                    <Input value={row.knes} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'knes', e.target.value)} className={inputClass} />
                  </td>
                  <td className="border border-slate-400 px-2 py-1">
                    <div className="flex items-center gap-1">
                      <Input value={row.client} onChange={(e) => handleRowChange(sectionIndex, rowIndex, 'client', e.target.value)} className={`${inputClass} flex-1`} />
                      {section.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(sectionIndex, rowIndex)}
                          className="text-red-400 hover:text-red-600 p-0.5"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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

      {/* ===== Bottom Buttons: Add Section + Save ===== */}
      <div className="flex items-center justify-between">
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
