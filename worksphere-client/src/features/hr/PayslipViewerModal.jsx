import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Download, Loader2 } from 'lucide-react';

export default function PayslipViewerModal({ isOpen, onClose, payrollId }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let objectUrl = null;

    if (isOpen && payrollId) {
      setLoading(true);
      setError(null);
      
      axiosInstance.get(`/payroll/${payrollId}/payslip`, {
        responseType: 'blob'
      })
      .then(response => {
        const fileBlob = new Blob([response.data], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(fileBlob);
        setPdfUrl(objectUrl);
      })
      .catch(err => {
        console.error('Failed to load payslip:', err);
        setError('Failed to load payslip document. It may not be generated yet.');
      })
      .finally(() => {
        setLoading(false);
      });
    }

    return () => {
      // Cleanup Blob URL when modal closes or unmounts
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setPdfUrl(null);
    };
  }, [isOpen, payrollId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payslip Document</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {payrollId}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a 
                href={pdfUrl} 
                download={`Payslip_${payrollId}.pdf`}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-blue-200"
              >
                <Download size={16} />
                Download PDF
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-white/50 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Generating Secure PDF...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <X size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Document Unavailable</h3>
              <p className="text-sm text-gray-500 max-w-sm">{error}</p>
            </div>
          )}

          {pdfUrl && !loading && !error && (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border-none"
              title={`Payslip ${payrollId}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
