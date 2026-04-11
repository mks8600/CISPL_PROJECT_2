import { Briefcase, Search, FileText, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { jobsApi } from '@/lib/api/client';

export default function ManageJobPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const data = await jobsApi.list();
            setJobs(data);
        } catch {
            toast.error('Failed to load jobs');
        }
    };

    const [formData, setFormData] = useState({
        jobNo: '',
        companyName: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const newJob = await jobsApi.create({
                jobNo: formData.jobNo,
                description: formData.companyName, // mapping companyName input to description in our db
            });

            setJobs((prev) => [newJob, ...prev]);
            toast.success('Job created successfully!');

            setFormData({ jobNo: '', companyName: '' });
        } catch (err) {
            toast.error(err.message || 'Failed to create job');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDeleteJob = async (id) => {
        try {
            await jobsApi.delete(id);
            setJobs(prev => prev.filter(job => job.id !== id));
            toast.success('Job deleted successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to delete job');
        }
    };

    const filteredJobs = jobs.filter(job => {
        const jobNo = job.job_no || job.jobNo || '';
        const desc = job.description || job.companyName || '';
        return jobNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            desc.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
                                    <Label htmlFor="companyName">Job Description / Company *</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="e.g., Acme Corp Pipeline"
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
                                                    <p className="font-semibold text-slate-900">{job.job_no || job.jobNo}</p>
                                                    <p className="text-sm text-slate-500">{job.description || job.companyName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right text-sm text-slate-500 hidden sm:block">
                                                    {new Date(job.created_at || job.createdAt).toLocaleDateString()}
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
