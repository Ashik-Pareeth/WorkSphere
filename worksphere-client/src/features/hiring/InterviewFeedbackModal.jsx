import React, { useState } from 'react';
import { submitInterviewFeedback } from '../../api/hiringApi';
import { Button } from '@/components/ui/button';
import { X, Star } from 'lucide-react';
import { toast } from 'sonner';

const InterviewFeedbackModal = ({ interview, onClose, onFeedbackSubmitted }) => {
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (score === 0) { toast.warning('Please select a score from 1 to 5'); return; }
        
        setLoading(true);
        try {
            await submitInterviewFeedback(interview.id, score, feedback);
            onFeedbackSubmitted();
            onClose();
        } catch (error) {
            console.error('Failed to submit feedback', error);
        } finally {
            setLoading(false);
        }
    };

    if (!interview) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Submit Feedback</h2>
                        <p className="text-sm text-gray-500">For {interview.candidate?.fullName} - Round {interview.roundNumber}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Overall Rating (1-5) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setScore(s)}
                                            className={`p-2 rounded-full transition-colors ${
                                                score >= s 
                                                    ? 'text-amber-400 hover:text-amber-500' 
                                                    : 'text-gray-300 dark:text-gray-600 hover:text-amber-200 dark:hover:text-amber-900'
                                            }`}
                                        >
                                            <Star className="h-8 w-8 fill-current" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Detailed Feedback Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white p-3"
                                    placeholder="Assess technical skills, culture fit, and overall impressions..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading || score === 0}>
                                {loading ? 'Submitting...' : 'Submit Evaluation'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InterviewFeedbackModal;
