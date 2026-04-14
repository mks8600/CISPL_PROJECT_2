import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Download, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { billingApi } from '@/lib/api/client';

export default function CompanyBillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Summary Data from Backend
    const [billingResult, setBillingResult] = useState({
        filmSizeTotals: {},
        totalSpotsAll: 0,
        sheetCount: 0,
        vendors: [],
        jobNos: []
    });
    
    // Filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('all');
    const [selectedJobNo, setSelectedJobNo] = useState('all');

    useEffect(() => {
        loadData();
    }, [user?.companyId, startDate, endDate, selectedVendor, selectedJobNo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await billingApi.getSummary({
                startDate,
                endDate,
                vendorId: selectedVendor,
                jobNo: selectedJobNo
            });
            setBillingResult(result);
        } catch (err) {
            console.error('Failed to load billing data', err);
            toast.error('Failed to load billing summary');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!billingResult.filmSizeTotals || Object.keys(billingResult.filmSizeTotals).length === 0) return;

        let csv = 'Film Size,Total Spot No.\n';
        Object.entries(billingResult.filmSizeTotals).forEach(([size, total]) => {
            csv += `"${size}","${total}"\n`;
        });
        csv += `"Grand Total","${billingResult.totalSpotsAll}"\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateRangeStr = startDate || endDate ? `_from_${startDate || 'start'}_to_${endDate || 'end'}` : '';
        link.download = `billing_summary${dateRangeStr}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedVendor('all');
        setSelectedJobNo('all');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Billing Summary</h1>
                </div>
                <p className="text-slate-500">Calculate total spot numbers grouped by film size across completed sheets.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filter Data</CardTitle>
                    <CardDescription>Select a date range, vendor, or job number to calculate the summary.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1 relative">
                            <Label htmlFor="startDate">From Date (Job Date)</Label>
                            <div className="relative">
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10 h-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1 relative">
                            <Label htmlFor="endDate">To Date (Job Date)</Label>
                            <div className="relative">
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 h-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="vendor">Vendor</Label>
                            <select
                                id="vendor"
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">All Vendors</option>
                                {billingResult.vendors.map(v => (
                                    <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="jobNo">Job No.</Label>
                            <select
                                id="jobNo"
                                value={selectedJobNo}
                                onChange={(e) => setSelectedJobNo(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">All Jobs</option>
                                {billingResult.jobNos.map(job => (
                                    <option key={job} value={job}>{job}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-none">
                            <Button 
                                variant="outline" 
                                onClick={handleClearFilters}
                                className="w-full md:w-auto h-10 border-slate-300 hover:bg-slate-50"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            <p className="text-sm font-medium text-slate-600">Calculating...</p>
                        </div>
                    </div>
                )}
                
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <CardTitle className="text-xl">Film Size Calculations</CardTitle>
                        <CardDescription className="mt-1">
                            Based on {billingResult.sheetCount} completed sheet{billingResult.sheetCount === 1 ? '' : 's'}.
                        </CardDescription>
                    </div>
                    {Object.keys(billingResult.filmSizeTotals).length > 0 && (
                        <div className="flex gap-2">
                            <Button 
                                onClick={exportToCSV}
                                variant="outline" 
                                className="shrink-0 flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export Excel</span>
                            </Button>
                            <Button 
                                onClick={() => window.print()}
                                variant="outline" 
                                className="shrink-0 flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                            >
                                <Calculator className="h-4 w-4" />
                                <span className="hidden sm:inline">Print Report</span>
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pt-6">
                    {Object.keys(billingResult.filmSizeTotals).length === 0 ? (
                        <div className="py-20 text-center text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                            <Calculator className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-600">No billing data found.</p>
                            <p className="text-sm mt-1 max-w-xs mx-auto">Try adjusting your filters or ensure your sheets are accepted and submitted by vendors.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-sm">
                                <thead>
                                    <tr>
                                        <th className="border border-slate-300 px-6 py-4 bg-slate-100/80 text-slate-700 text-left w-1/2 shadow-xs font-semibold text-base uppercase tracking-wider">Film Size</th>
                                        <th className="border border-slate-300 px-6 py-4 bg-slate-100/80 text-slate-700 text-right shadow-xs font-semibold text-base uppercase tracking-wider">Total Spot No.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(billingResult.filmSizeTotals).map(([size, total]) => (
                                        <tr key={size} className="border-b border-slate-200 hover:bg-blue-50/30 transition-colors group">
                                            <td className="border-r border-slate-300 px-6 py-4 bg-white font-medium text-slate-700 text-lg group-hover:text-blue-700 transition-colors">{size}</td>
                                            <td className="border border-slate-300 px-6 py-4 bg-white font-bold text-slate-900 text-right text-lg">{total}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-4 border-slate-400">
                                        <td className="border-r border-slate-300 px-6 py-5 bg-slate-100/50 font-bold text-slate-800 text-right text-base">Grand Total:</td>
                                        <td className="border border-slate-300 px-6 py-5 bg-blue-100/40 font-black text-blue-900 text-right text-2xl">{billingResult.totalSpotsAll}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
