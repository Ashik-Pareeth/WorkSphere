import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchPublicJobDetails } from '../../api/hiringApi';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Clock,
  ArrowLeft,
  Share2,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PublicJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetchPublicJobDetails(id);
        setJob(res.data);
      } catch (err) {
        console.error('Failed to fetch job details', err);
        setError('This position may have been closed or removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 dark:bg-blue-900/50 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold font-sora text-slate-900 dark:text-white mb-2">
            Position Unavailable
          </h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link to="/careers">
            <Button className="w-full">View All Open Roles</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-slate-200 font-dm">
      <nav className="border-b bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/careers"
            className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Careers
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold font-sora text-[10px]">
                W
              </span>
            </div>
            <span className="font-bold text-sm tracking-tight font-sora">
              WorkSphere
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white font-sora mb-6">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm mb-8">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
              <LayoutDashboard className="w-4 h-4" />
              {job.department?.name || 'General'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <MapPin className="w-4 h-4" />
              {job.location || 'Remote Options'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <Clock className="w-4 h-4" />
              {job.employmentType || 'Full-time'}
            </span>
          </div>

          <div className="flex items-center gap-4 border-y border-slate-200 dark:border-white/5 py-6">
            <Button
              onClick={() => navigate(`/jobs/${job.id}/apply`)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-8 text-base h-12"
            >
              Apply for this role
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 border-slate-200 dark:border-white/10 dark:hover:bg-white/5"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
            >
              <Share2 className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </header>

        {/* Content Section */}
        <article className="prose prose-slate dark:prose-invert prose-blue max-w-none">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-10 shadow-sm leading-relaxed whitespace-pre-wrap text-[16px] text-slate-700 dark:text-slate-300">
            <ReactMarkdown>
              {job.description || 'No detailed description provided.'}
            </ReactMarkdown>
          </div>
        </article>

        {/* Footer Apply CTA */}
        <div className="mt-12 mb-20 p-8 md:p-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900/80 dark:to-indigo-950/30 rounded-3xl border border-blue-100 dark:border-indigo-500/10 text-center">
          <h3 className="text-2xl font-bold font-sora text-slate-900 dark:text-white mb-4">
            Ready to join us?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Submit your application and our talent team will review your
            profile.
          </p>
          <Button
            onClick={() => navigate(`/jobs/${job.id}/apply`)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-10 h-14 text-base"
          >
            Apply Now
          </Button>
        </div>
      </main>
    </div>
  );
}
