import React from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  AlertOctagon,
} from 'lucide-react';

const Stars = ({ value, onChange, disabled }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => !disabled && onChange(s)}
        style={{
          color: value >= s ? '#F59E0B' : '#D4CFC7',
          cursor: disabled ? 'default' : 'pointer',
        }}
        disabled={disabled}
        className="text-2xl transition-transform hover:scale-110"
      >
        ★
      </button>
    ))}
  </div>
);

export default function EvidenceTab({
  task,
  evidenceList,
  loading,
  uploading,
  selectedFile,
  fileInputRef,
  handleFileSelect,
  handleRemoveFile,
  handleFileUpload,
  handleEvidenceReview,
  activeReview,
  setActiveReview,
  reviewingEvidence,
  isManager,
  isAssigner,
  isAuditor,
  rating,
  setRating,
  handleLateRating,
  isCompleting,
  handleApproveAndComplete,
  handleCancelTask,
  isCanceling,
}) {
  return (
    <div className="flex flex-col gap-6 p-2 mt-2 h-[500px] overflow-y-auto">
      {/* Upload Zone */}
      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3 block">
            Submit Proof of Work
          </span>
          {!selectedFile ? (
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-semibold text-gray-700">
                Click to select file
              </span>
              <span className="text-xs text-gray-400 mt-1">
                PDF, DOCX, PNG, JPG (Max 5MB)
              </span>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-500 w-6 h-6" />
                <span className="text-sm font-medium text-gray-800">
                  {selectedFile.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRemoveFile}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evidence List */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 block">
          Uploaded Evidence
        </span>
        {loading ? (
          <div className="text-sm text-gray-400 italic py-4 text-center">
            Loading...
          </div>
        ) : evidenceList.length === 0 ? (
          <div className="text-sm text-gray-400 italic py-4 text-center bg-gray-50 border border-gray-200 rounded-xl">
            No files uploaded yet.
          </div>
        ) : (
          evidenceList.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    <FileText size={18} />
                  </div>
                  <div>
                    <a
                      href={`http://localhost:8080/${file.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-600 hover:underline block mb-0.5"
                    >
                      {file.fileName || 'Document'}
                    </a>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(file.createdAt).toLocaleString()}
                      </span>
                      <span
                        className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${file.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : file.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {file.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role-gated controls */}
                <div className="flex gap-2">
                  {isManager && file.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() =>
                          handleEvidenceReview(file.id, 'ACCEPTED')
                        }
                        disabled={reviewingEvidence}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                        title="Accept"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setActiveReview({
                            id: file.id,
                            status: 'REJECTED',
                            feedback: '',
                          })
                        }
                        disabled={reviewingEvidence}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {isAuditor && (
                    <button className="px-2 py-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 flex items-center gap-1 transition-colors">
                      <AlertOctagon size={12} /> Flag Context
                    </button>
                  )}
                </div>
              </div>

              {/* Reject Reason input toggle */}
              {activeReview.id === file.id &&
                activeReview.status === 'REJECTED' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      className="w-full text-sm p-2 border border-gray-300 rounded-md outline-none focus:border-rose-400 bg-white"
                      value={activeReview.feedback}
                      onChange={(e) =>
                        setActiveReview((prev) => ({
                          ...prev,
                          feedback: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() =>
                          setActiveReview({
                            id: null,
                            status: null,
                            feedback: '',
                          })
                        }
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          handleEvidenceReview(file.id, 'REJECTED')
                        }
                        disabled={
                          reviewingEvidence || !activeReview.feedback.trim()
                        }
                        className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded disabled:opacity-50 hover:bg-rose-700"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              {file.status === 'REJECTED' && file.feedback && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-2.5 rounded-md mt-1 border-l-2 border-l-rose-500">
                  <span className="font-bold">Reason:</span> {file.feedback}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* PERFORMANCE EVALUATION SECTION */}
      {(isAssigner || isManager) &&
        task.status !== 'TODO' &&
        task.status !== 'CANCELLED' && (
          <div className={`p-5 rounded-xl border shadow-sm mt-4 transition-all ${
            task.status === 'COMPLETED' ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  Performance Evaluation
                </h4>
                <p className="text-xs text-gray-500">
                  {task.status === 'COMPLETED' 
                    ? (task.managerRating ? 'Final performance record for this task.' : 'Task is complete. You can still provide a late rating.')
                    : 'Rate the execution quality before marking this task as complete.'
                  }
                </p>
              </div>
              {task.status === 'COMPLETED' && task.managerRating && (
                <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase px-2 py-1 rounded">
                  Rated
                </div>
              )}
            </div>

            <div className="flex flex-col items-center">
              {/* Stars Logic */}
              <Stars
                value={task.managerRating || rating}
                onChange={setRating}
                disabled={isCompleting || (task.status === 'COMPLETED' && task.managerRating) || (task.status !== 'IN_REVIEW' && task.status !== 'COMPLETED') || (task.status === 'IN_REVIEW' && task.requiresEvidence && !evidenceList.some(e => e.status === 'ACCEPTED'))}
              />

              {/* Action Buttons & Status Messages */}
              {task.status === 'COMPLETED' ? (
                !task.managerRating && (
                  <button
                    onClick={handleLateRating}
                    disabled={isCompleting || rating === 0}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isCompleting ? 'Submitting...' : 'Submit Late Rating'}
                  </button>
                )
              ) : task.status === 'IN_REVIEW' ? (
                (task.requiresEvidence && !evidenceList.some(e => e.status === 'ACCEPTED')) ? (
                  <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                    <span className="text-xs font-semibold">Unlock rating by accepting evidence first.</span>
                  </div>
                ) : (
                  <button
                    onClick={handleApproveAndComplete}
                    disabled={isCompleting || rating === 0}
                    className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isCompleting ? 'Finalizing...' : 'Complete & Disburse Rating'}
                  </button>
                )
              ) : (
                <div className="mt-4 text-gray-400 text-xs italic">
                  Rating will unlock when task is submitted for review.
                </div>
              )}
            </div>
          </div>
        )}

      {/* Danger Zone */}
      {(isAssigner || isManager) &&
        task.status !== 'COMPLETED' &&
        task.status !== 'CANCELLED' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mt-4">
            <span className="text-[10px] font-bold tracking-widest uppercase text-red-600 mb-3 block">
              Danger Zone
            </span>
            <button
              onClick={handleCancelTask}
              disabled={isCanceling}
              className="w-full py-2 border border-red-300 text-red-600 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isCanceling ? 'Canceling...' : 'Cancel Task Forever'}
            </button>
          </div>
        )}
    </div>
  );
}
