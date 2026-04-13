import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applyForJob } from '../../api/hiringApi';
import { Button } from '@/components/ui/button';
import { Briefcase, Send, CheckCircle2 } from 'lucide-react';

const PublicApplyForm = () => {
  const { openingId } = useParams();
  const navigate = useNavigate();

  // In a real scenario, you would fetch JobOpening details first to show Title/Description
  // For now we will assume the ID is valid and render the form

  const [formData, setFormData] = useState({
    jobOpeningId: openingId,
    fullName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverNote: '',
    source: 'PORTAL', // Default enum value
  });
  const [resumeFile, setResumeFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      (!formData.resumeUrl.trim() && !resumeFile)
    ) {
      setError('Full Name, Email, and a Resume (Link or File) are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.resumeUrl.trim()) {
      try {
        // Basic URL validation
        new URL(formData.resumeUrl);
      } catch (_) { // eslint-disable-line no-unused-vars
        setError('Please enter a valid Resume Link URL (e.g., https://...).');
        return;
      }
    }

    setLoading(true);
    try {
      await applyForJob(formData, resumeFile);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit application. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl text-center border border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Thank you for your interest. We have received your application and
            our HR team will review it shortly.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Return to Corporate Site
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Join Our Team
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Please fill out the form below to apply for the position.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-l-4 border-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div className="sm:col-span-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-6 mt-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Resume Information
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Please provide a link to your resume OR upload a file
                  directly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="resumeUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Resume Link (URL)
                    </label>
                    <p className="text-xs text-gray-500 mb-2 mt-1">
                      Google Drive, Dropbox, or Portfolio.
                    </p>
                    <div className="mt-1">
                      <input
                        type="url"
                        name="resumeUrl"
                        id="resumeUrl"
                        value={formData.resumeUrl}
                        onChange={handleChange}
                        placeholder="https://"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="resumeFile"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Upload Resume File
                    </label>
                    <p className="text-xs text-gray-500 mb-2 mt-1">
                      PDF, DOC, or DOCX formats.
                    </p>
                    <div className="mt-1">
                      <input
                        type="file"
                        name="resumeFile"
                        id="resumeFile"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="coverNote"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cover Note
                </label>
                <div className="mt-1">
                  <textarea
                    id="coverNote"
                    name="coverNote"
                    rows={4}
                    value={formData.coverNote}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                    placeholder="Tell us why you're a great fit..."
                  />
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Send className="mr-2 h-5 w-5" />
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicApplyForm;
