import React, { useState } from 'react';
import { generateOffer } from '../../api/hiringApi';
import { Button } from '@/components/ui/button';
import { X, FileSignature, DollarSign, Calendar } from 'lucide-react';

const OfferGenerationModal = ({ candidate, onClose, onOfferGenerated }) => {
    const [loading, setLoading] = useState(false);
    
    // In a full implementation, you'd fetch the JobOpening details here to populate the default salary bands
    const [formData, setFormData] = useState({
        candidateId: candidate?.id,
        jobOpeningId: candidate?.jobOpening?.id || '',
        proposedSalary: '',
        joiningDate: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                candidate: { id: formData.candidateId },
                jobOpening: { id: formData.jobOpeningId },
                proposedSalary: parseFloat(formData.proposedSalary),
                joiningDate: new Date(formData.joiningDate).toISOString()
            };
            await generateOffer(payload);
            onOfferGenerated();
            onClose();
        } catch (error) {
            console.error('Failed to generate offer', error);
        } finally {
            setLoading(false);
        }
    };

    if (!candidate) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-purple-500" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Draft Offer Letter</h2>
                            <p className="text-sm text-gray-500">For {candidate.fullName}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <DollarSign className="inline h-4 w-4 mr-1 text-gray-400" /> Proposed Salary (Annual)
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="proposedSalary"
                                        required
                                        min="0"
                                        placeholder="e.g. 85000"
                                        value={formData.proposedSalary}
                                        onChange={handleChange}
                                        className="w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Calendar className="inline h-4 w-4 mr-1 text-gray-400" /> Expected Joining Date
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="joiningDate"
                                    required
                                    value={formData.joiningDate}
                                    onChange={handleChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
                            <p className="text-xs text-purple-800 dark:text-purple-300">
                                This will generate an official offer link. The link will be displayed in the backend server logs for you to verify during testing.
                            </p>
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate & Send Offer'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OfferGenerationModal;
