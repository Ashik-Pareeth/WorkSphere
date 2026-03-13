import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicJobOpenings } from '../../api/hiringApi';
import { Button } from '@/components/ui/button';
import { Briefcase, Building2, MapPin, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

export default function PublicCareersList() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Using the specific public endpoint
                const res = await fetchPublicJobOpenings();
                setJobs(res.data);
            } catch (err) {
                console.error("Failed to fetch public jobs", err);
                setError("Failed to load available positions. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-slate-200 font-dm">
            {/* Minimal Header */}
            <nav className="border-b bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold font-sora text-sm">W</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight font-sora group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">WorkSphere</span>
                    </Link>
                    <Link to="/">
                        <Button variant="ghost" className="text-sm font-medium">Back to Home</Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                {/* Brand / Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-500/10 rounded-2xl mb-6">
                        <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-sora">
                        Join our mission
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We're building the future of workplace management. Discover your next career move and help us shape the modern OS for modern teams.
                    </p>
                </div>

                {/* Listing */}
                <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-xl font-semibold font-sora">Open Positions</h2>
                        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 py-1 px-3 rounded-full text-sm font-semibold">
                            {jobs.length} Roles
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {loading && (
                            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                                <p>Loading opportunities...</p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="p-12 text-center text-red-500 bg-red-50 dark:bg-red-500/10">
                                {error}
                            </div>
                        )}

                        {!loading && !error && jobs.length === 0 && (
                            <div className="p-12 text-center">
                                <p className="text-slate-500 text-lg mb-2">We don't have any open positions right now.</p>
                                <p className="text-sm text-slate-400">Please check back later.</p>
                            </div>
                        )}

                        {jobs.map(job => (
                            <Link 
                                key={job.id} 
                                to={`/careers/${job.id}`}
                                className="block p-6 md:p-8 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {job.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                                <Building2 className="w-4 h-4" />
                                                {job.department?.name || 'General'}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                                <MapPin className="w-4 h-4" />
                                                {job.location || 'Remote Options Available'}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md font-medium">
                                                {job.employmentType || 'Full-time'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
