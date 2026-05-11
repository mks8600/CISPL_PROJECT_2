import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Download, Calendar, Loader2, CheckCircle2, Wrench, RefreshCcw, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { billingApi } from '@/lib/api/client';

function formatDate(dateStr) {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
}

export default function CompanyBillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const printRef = useRef(null);

    const [billingResult, setBillingResult] = useState({
        filmSizeTotals: {}, totalSpotsAll: 0,
        statusCounts: { OK: 0, Repair: 0, 'R/S': 0, Retake: 0, Missing: 0 },
        detailedRows: [], sheetCount: 0, vendors: [], jobNos: []
    });

    const [pricingConfig, setPricingConfig] = useState({});
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('all');
    const [selectedJobNo, setSelectedJobNo] = useState('all');
    const [groupBy, setGroupBy] = useState('date');

    useEffect(() => { loadData(); }, [user?.companyId, startDate, endDate, selectedVendor, selectedJobNo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await billingApi.getSummary({ startDate, endDate, vendorId: selectedVendor, jobNo: selectedJobNo });
            setBillingResult(result);
        } catch (err) {
            console.error('Failed to load billing data', err);
            toast.error('Failed to load billing summary');
        } finally { setLoading(false); }
    };

    const groupedRows = () => {
        const rows = billingResult.detailedRows || [];
        const groups = {};
        for (const row of rows) {
            const key = groupBy === 'date' ? (row.date || 'Unknown') : (row.serialNo || 'Unknown');
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        }
        return groups;
    };

    const exportToCSV = () => {
        const rows = billingResult.detailedRows || [];
        if (rows.length === 0) return;
        let csv = 'Status Summary\n';
        csv += `OK,${billingResult.statusCounts?.OK || 0}\nRepair,${billingResult.statusCounts?.Repair || 0}\nR/S,${billingResult.statusCounts?.['R/S'] || 0}\n\n`;
        csv += 'Film Size Summary\n';
        csv += 'Film Size,Total Spots,Price per Spot,Total Amount\n';
        let grandTotal = 0;
        Object.entries(billingResult.filmSizeTotals).forEach(([size, total]) => {
            const price = parseFloat(pricingConfig[size]) || 0;
            const amount = total * price;
            grandTotal += amount;
            csv += `"${size}","${total}","${price}","${amount}"\n`;
        });
        csv += `"Grand Total","${billingResult.totalSpotsAll}","","${grandTotal}"\n\n`;
        csv += 'Detailed Report\n';
        csv += 'DATE,SR NO,JOB NO,RS NO,WELD IDENTIFICATION,SPOT NO,FILM SIZE,OBSERVATION\n';
        for (const row of rows) {
            const obsStr = (row.observations || []).map(o => `${o.label}:${o.companyValue}`).join(' | ');
            csv += `"${formatDate(row.date)}","${row.serialNo}","${row.jobNo || ''}","${row.rsNo || ''}","${row.weldIdentification}","${row.spotNo}","${row.filmSize}","${obsStr}"\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `billing_report_${startDate || 'all'}_to_${endDate || 'all'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Billing Report</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        th,td{border:1px solid #333;padding:6px 8px;text-align:left}
        th{background:#f0f0f0;font-weight:bold}
        .group-header{background:#e8d5b0;font-weight:bold;padding:8px}
        .status-row{display:flex;gap:30px;margin:10px 0}
        .status-item{font-weight:bold}
        h2{margin:20px 0 5px}
        .obs-cell{font-size:11px}
        </style></head><body>`);
        win.document.write(`<h1>Billing Report</h1>`);
        if (startDate || endDate) win.document.write(`<p>Period: ${formatDate(startDate) || 'Start'} — ${formatDate(endDate) || 'End'}</p>`);
        win.document.write(`<div class="status-row"><span class="status-item">OK: ${billingResult.statusCounts?.OK || 0}</span><span class="status-item">Repair: ${billingResult.statusCounts?.Repair || 0}</span><span class="status-item">R/S: ${billingResult.statusCounts?.['R/S'] || 0}</span></div>`);
        win.document.write(`<h2>Film Size Summary</h2><table><tr><th>Film Size</th><th>Total Spots</th><th>Price/Spot</th><th>Amount</th></tr>`);
        let gt = 0;
        Object.entries(billingResult.filmSizeTotals).forEach(([s, t]) => {
            const p = parseFloat(pricingConfig[s]) || 0; const a = t * p; gt += a;
            win.document.write(`<tr><td>${s}</td><td>${t}</td><td>₹${p}</td><td>₹${a.toLocaleString('en-IN')}</td></tr>`);
        });
        win.document.write(`<tr><th colspan="3" style="text-align:right">Grand Total</th><th>₹${gt.toLocaleString('en-IN')}</th></tr></table>`);
        win.document.write(`<h2>Detailed Report</h2>`);
        const groups = groupedRows();
        for (const [key, rows] of Object.entries(groups)) {
            const label = groupBy === 'date' ? formatDate(key) : `SR NO: ${key}`;
            win.document.write(`<div class="group-header">${label}</div><table><tr><th>DATE</th><th>SR NO</th><th>JOB NO</th><th>RS NO</th><th>WELD IDENTIFICATION</th><th>SPOT NO</th><th>FILM SIZE</th><th>OBSERVATION</th></tr>`);
            for (const row of rows) {
                const obsCount = (row.observations || []).length;
                const firstObs = (row.observations || [])[0];
                win.document.write(`<tr><td rowspan="${obsCount || 1}">${formatDate(row.date)}</td><td rowspan="${obsCount || 1}">${row.serialNo || '—'}</td><td rowspan="${obsCount || 1}">${row.jobNo || '—'}</td><td rowspan="${obsCount || 1}">${row.rsNo || '—'}</td><td rowspan="${obsCount || 1}">${row.weldIdentification}</td><td rowspan="${obsCount || 1}">${row.spotNo}</td><td rowspan="${obsCount || 1}">${row.filmSize}</td>`);
                if (firstObs) win.document.write(`<td class="obs-cell">${firstObs.label} — ${firstObs.companyValue}</td></tr>`);
                else win.document.write(`<td>—</td></tr>`);
                (row.observations || []).slice(1).forEach(obs => {
                    win.document.write(`<tr><td class="obs-cell">${obs.label} — ${obs.companyValue}</td></tr>`);
                });
            }
            win.document.write(`</table>`);
        }
        win.document.write(`</body></html>`);
        win.document.close();
        win.print();
    };

    const handleClearFilters = () => { setStartDate(''); setEndDate(''); setSelectedVendor('all'); setSelectedJobNo('all'); };
    const groups = groupedRows();
    const hasData = (billingResult.detailedRows || []).length > 0 || Object.keys(billingResult.filmSizeTotals).length > 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12" ref={printRef}>
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Billing Report</h1>
                </div>
                <p className="text-slate-500">Detailed billing report with film sizes, observations and pricing.</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader><CardTitle className="text-lg">Filter Data</CardTitle><CardDescription>Filter by date, vendor, or job number.</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1 relative">
                            <Label htmlFor="startDate">From Date</Label>
                            <div className="relative"><Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="pl-10 h-10" /><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /></div>
                        </div>
                        <div className="space-y-2 flex-1 relative">
                            <Label htmlFor="endDate">To Date</Label>
                            <div className="relative"><Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="pl-10 h-10" /><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /></div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="vendor">Vendor</Label>
                            <select id="vendor" value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
                                <option value="all">All Vendors</option>
                                {billingResult.vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="jobNo">Job No.</Label>
                            <select id="jobNo" value={selectedJobNo} onChange={e => setSelectedJobNo(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
                                <option value="all">All Jobs</option>
                                {billingResult.jobNos.map(j => <option key={j} value={j}>{j}</option>)}
                            </select>
                        </div>
                        <div className="flex-none"><Button variant="outline" onClick={handleClearFilters} className="h-10 border-slate-300 hover:bg-slate-50">Clear</Button></div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Counts */}
            {hasData && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg text-green-700"><CheckCircle2 className="h-5 w-5" /></div><span className="font-semibold text-green-800">OK</span></div>
                        <span className="text-2xl font-bold text-green-900">{billingResult.statusCounts?.OK || 0}</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 bg-red-100 rounded-lg text-red-700"><Wrench className="h-5 w-5" /></div><span className="font-semibold text-red-800">Repair</span></div>
                        <span className="text-2xl font-bold text-red-900">{billingResult.statusCounts?.Repair || 0}</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-lg text-orange-700"><RefreshCcw className="h-5 w-5" /></div><span className="font-semibold text-orange-800">R/S</span></div>
                        <span className="text-2xl font-bold text-orange-900">{billingResult.statusCounts?.['R/S'] || 0}</span>
                    </div>
                </div>
            )}

            {/* Tabs + Actions */}
            <Card className="relative overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /><p className="text-sm font-medium text-slate-600">Loading...</p></div>
                    </div>
                )}

                <CardHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Summary</button>
                            <button onClick={() => setActiveTab('detailed')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'detailed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Detailed Report</button>
                        </div>
                        {hasData && (
                            <div className="flex gap-2 flex-wrap">
                                {activeTab === 'detailed' && (
                                    <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium">
                                        <option value="date">Group by Date</option>
                                        <option value="srNo">Group by SR No.</option>
                                    </select>
                                )}
                                <Button onClick={exportToCSV} variant="outline" className="h-9 flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"><Download className="h-4 w-4" /><span className="hidden sm:inline">Export Excel</span></Button>
                                <Button onClick={handlePrint} variant="outline" className="h-9 flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"><Printer className="h-4 w-4" /><span className="hidden sm:inline">Print</span></Button>
                            </div>
                        )}
                    </div>
                    <CardDescription className="mt-2">Based on {billingResult.sheetCount} completed sheet{billingResult.sheetCount === 1 ? '' : 's'}.</CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    {!hasData ? (
                        <div className="py-20 text-center text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                            <Calculator className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-600">No billing data found.</p>
                            <p className="text-sm mt-1 max-w-xs mx-auto">Try adjusting your filters or ensure your sheets are accepted and submitted.</p>
                        </div>
                    ) : activeTab === 'summary' ? (
                        /* ─── SUMMARY TAB ─── */
                        <div className="overflow-x-auto rounded-lg border border-slate-300">
                            <table className="w-full border-collapse text-sm">
                                <thead><tr>
                                    <th className="border-b border-slate-300 px-6 py-4 bg-slate-100/80 text-slate-700 text-left font-semibold text-base uppercase tracking-wider">Film Size</th>
                                    <th className="border-b border-slate-300 px-6 py-4 bg-slate-100/80 text-slate-700 text-center font-semibold text-base uppercase tracking-wider">Total Spots</th>
                                    <th className="border-b border-slate-300 px-6 py-4 bg-slate-100/80 text-slate-700 text-center font-semibold text-base uppercase tracking-wider">Price/Spot (₹)</th>
                                    <th className="border-b border-slate-300 px-6 py-4 bg-slate-100/80 text-slate-700 text-right font-semibold text-base uppercase tracking-wider">Amount (₹)</th>
                                </tr></thead>
                                <tbody>
                                    {Object.entries(billingResult.filmSizeTotals).map(([size, total]) => {
                                        const price = parseFloat(pricingConfig[size]) || 0;
                                        return (
                                            <tr key={size} className="border-b border-slate-200 hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4 bg-white font-medium text-slate-700 text-lg group-hover:text-blue-700 transition-colors">{size}</td>
                                                <td className="px-6 py-4 bg-white font-bold text-slate-900 text-center text-lg">{total}</td>
                                                <td className="px-6 py-4 bg-white text-center">
                                                    <div className="flex justify-center"><div className="relative w-32">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                                                        <Input type="number" min="0" className="pl-7 text-right font-medium" placeholder="0.00" value={pricingConfig[size] || ''} onChange={e => setPricingConfig(p => ({ ...p, [size]: e.target.value }))} />
                                                    </div></div>
                                                </td>
                                                <td className="px-6 py-4 bg-slate-50/50 font-bold text-slate-800 text-right text-lg">₹{(total * price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        );
                                    })}
                                    {(() => {
                                        const gt = Object.entries(billingResult.filmSizeTotals).reduce((s, [sz, t]) => s + (t * (parseFloat(pricingConfig[sz]) || 0)), 0);
                                        return (<tr className="border-t-4 border-slate-400 bg-blue-50/40">
                                            <td className="px-6 py-5 font-bold text-slate-800 text-right text-base" colSpan={3}>Grand Total:</td>
                                            <td className="px-6 py-5 font-black text-blue-900 text-right text-2xl">₹{gt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>);
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* ─── DETAILED REPORT TAB ─── */
                        <div className="space-y-6">
                            {Object.entries(groups).map(([key, rows]) => {
                                const label = groupBy === 'date' ? formatDate(key) : `SR NO: ${key}`;
                                return (
                                    <div key={key} className="rounded-lg border border-slate-300 overflow-hidden">
                                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
                                            <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">{groupBy === 'date' ? 'DATE' : 'SR NO.'}: <span className="text-slate-900">{label}</span></span>
                                            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600">{rows.length} entr{rows.length === 1 ? 'y' : 'ies'}</span>
                                        </div>
                                        <table className="w-full border-collapse text-sm">
                                            <thead><tr className="bg-slate-50">
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-left font-semibold text-slate-700 text-xs uppercase">DATE</th>
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-left font-semibold text-slate-700 text-xs uppercase">SR NO.</th>
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-left font-semibold text-slate-700 text-xs uppercase">JOB NO.</th>
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-left font-semibold text-slate-700 text-xs uppercase">RS NO.</th>
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-left font-semibold text-slate-700 text-xs uppercase">Weld Identification</th>
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700 text-xs uppercase w-20">Spot No</th>
                                                <th className="border-b border-r border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700 text-xs uppercase w-24">Film Size</th>
                                                <th className="border-b border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700 text-xs uppercase" colSpan={2}>Observation</th>
                                            </tr></thead>
                                            <tbody>
                                                {rows.map((row, rIdx) => {
                                                    const obs = row.observations || [];
                                                    const obsCount = Math.max(obs.length, 1);
                                                    return obs.length > 0 ? obs.map((o, oIdx) => (
                                                        <tr key={`${rIdx}-${oIdx}`} className="border-b border-slate-200 hover:bg-slate-50/50">
                                                            {oIdx === 0 && (<>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium align-top text-xs">{formatDate(row.date)}</td>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium align-top">{row.serialNo || '—'}</td>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium align-top text-xs">{row.jobNo || '—'}</td>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium align-top text-xs">{row.rsNo || '—'}</td>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-slate-800 font-medium align-top text-xs">{row.weldIdentification}</td>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-center font-bold text-slate-900 align-top">{row.spotNo}</td>
                                                                <td rowSpan={obsCount} className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-700 align-top">{row.filmSize}</td>
                                                            </>)}
                                                            <td className="border-r border-slate-200 px-3 py-1.5 text-center text-xs font-medium text-slate-600 w-16">{o.label}</td>
                                                            <td className={`px-3 py-1.5 text-center text-xs font-bold w-20 ${o.companyValue === 'OK' ? 'text-green-700' : o.companyValue === 'Repair' ? 'text-red-700' : o.companyValue === 'R/S' ? 'text-orange-700' : 'text-slate-700'}`}>{o.companyValue}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr key={rIdx} className="border-b border-slate-200 hover:bg-slate-50/50">
                                                            <td className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium text-xs">{formatDate(row.date)}</td>
                                                            <td className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium">{row.serialNo || '—'}</td>
                                                            <td className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium text-xs">{row.jobNo || '—'}</td>
                                                            <td className="border-r border-slate-300 px-3 py-2 text-slate-700 font-medium text-xs">{row.rsNo || '—'}</td>
                                                            <td className="border-r border-slate-300 px-3 py-2 text-slate-800 font-medium text-xs">{row.weldIdentification}</td>
                                                            <td className="border-r border-slate-300 px-3 py-2 text-center font-bold text-slate-900">{row.spotNo}</td>
                                                            <td className="border-r border-slate-300 px-3 py-2 text-center font-medium text-slate-700">{row.filmSize}</td>
                                                            <td colSpan={2} className="px-3 py-2 text-center text-xs text-slate-400">—</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
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
