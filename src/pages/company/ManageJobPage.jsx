import { Briefcase, Search, FileText, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ManageJobPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState(() => {
        try {
            const saved = localStorage.getItem('crystal_jobs');
            const allJobs = saved ? JSON.parse(saved) : [];
            return allJobs.filter(j => j.companyId === user?.companyId);
        } catch {
            return [];
        }
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Only override the jobs specific to this company, preserve others
        const saved = localStorage.getItem('crystal_jobs');
        const allJobs = saved ? JSON.parse(saved) : [];
        const otherJobs = allJobs.filter(j => j.companyId !== user?.companyId);
        localStorage.setItem('crystal_jobs', JSON.stringify([...otherJobs, ...jobs]));
    }, [jobs, user?.companyId]);

    const [formData, setFormData] = useState({
        jobNo: '',
        companyName: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            const newJob = {
                id: Date.now().toString(),
                jobNo: formData.jobNo,
                companyName: formData.companyName,
                companyId: user?.companyId,
                createdAt: new Date().toISOString(),
            };

            setJobs((prev) => [newJob, ...prev]);
            toast.success('Job created successfully!');

            setFormData({ jobNo: '', companyName: '' });
        } catch {
            toast.error('Failed to create job');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDeleteJob = (id) => {
        setJobs(prev => prev.filter(job => job.id !== id));
        toast.success('Job deleted successfully!');
    };

    const filteredJobs = jobs.filter(job =>
        job.jobNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-bold text-slate-900">Manage Job No</h1>
                </div>
                <p className="text-slate-500">Create and manage your jobs</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Create Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Job</CardTitle>
                                <CardDescription>Enter the job information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="jobNo">Job No *</Label>
                                    <Input
                                        id="jobNo"
                                        placeholder="e.g., JOB-2026-001"
                                        value={formData.jobNo}
                                        onChange={(e) => handleChange('jobNo', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name *</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="e.g., Acme Corp"
                                        value={formData.companyName}
                                        onChange={(e) => handleChange('companyName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Job'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* Right Column: Jobs List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>Jobs List</CardTitle>
                                    <CardDescription>View and search all created jobs</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search jobs..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {jobs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                    <p>No jobs found.</p>
                                    <p className="text-sm">Create a new job to see it listed here.</p>
                                </div>
                            ) : filteredJobs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>No jobs match your search "{searchQuery}"</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-white hover:border-blue-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{job.jobNo}</p>
                                                    <p className="text-sm text-slate-500">{job.companyName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-sm text-slate-500 hidden sm:block">
                                                    {new Date(job.createdAt).toLocaleDateString()}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                    onClick={() => handleDeleteJob(job.id)}
                                                    title="Delete Job"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
