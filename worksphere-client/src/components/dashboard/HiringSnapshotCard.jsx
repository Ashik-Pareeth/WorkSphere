import React, { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import { fetchHiringStats } from '../../api/hiringApi';

export default function HiringSnapshotCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchHiringStats()
      .then(res => {
         if (isMounted) {
            setStats(res.data);
            setLoading(false);
         }
      })
      .catch(err => {
         console.error(err);
         if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full overflow-hidden animate-pulse">
        <div className="h-6 w-1/2 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="h-20 bg-gray-100 rounded border border-gray-100"></div>
            <div className="h-20 bg-gray-100 rounded border border-gray-100"></div>
        </div>
        <div className="flex flex-col gap-4">
            <div className="h-4 w-full bg-gray-100 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { openJobs, totalCandidates, byStage } = stats;
  // Calculate max for the progress bars
  const maxCandidates = Math.max(...Object.values(byStage), 1); // Avoid div by 0

  const stageColors = {
     'APPLIED': 'bg-blue-500',
     'SHORTLISTED': 'bg-indigo-500',
     'INTERVIEWING': 'bg-amber-500',
     'OFFERED': 'bg-emerald-500',
     'ACCEPTED': 'bg-emerald-700'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Hiring Pipeline Stats
        </h2>
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
         {/* Top Level Metrics */}
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 flex flex-col items-center justify-center text-center">
               <span className="text-3xl font-bold text-indigo-700 font-mono tracking-tighter">{openJobs}</span>
               <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Active Roles</span>
            </div>
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex flex-col items-center justify-center text-center">
               <span className="text-3xl font-bold text-blue-700 font-mono tracking-tighter">{totalCandidates}</span>
               <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Tot. Candidates</span>
            </div>
         </div>

         {/* Funnel visualization */}
         <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Pipeline Funnel</h3>
            {Object.entries(byStage).map(([stage, count]) => {
               const percentage = (count / maxCandidates) * 100;
               return (
                 <div key={stage} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="font-bold text-gray-600">{stage}</span>
                       <span className="font-mono font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${stageColors[stage] || 'bg-gray-400'}`} 
                         style={{ width: `${percentage}%` }}
                       />
                    </div>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
