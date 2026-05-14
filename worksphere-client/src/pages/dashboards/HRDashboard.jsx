import React, { useState, useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees } from '../../api/employeeApi';
import { fetchAllJobOpenings, fetchHiringStats } from '../../api/hiringApi';
import { getPendingLeaveRequests } from '../../api/leaveApi';
import axiosInstance from '../../api/axiosInstance';
import PayrollStatusBand from '../../components/dashboard/PayrollStatusBand';
import {
  Users,
  Briefcase,
  AlertTriangle,
  CircleDollarSign,
  CalendarClock,
  Ticket,
  UserMinus,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Users2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'];

const ActionRow = ({ icon, title, subtitle, count, route, colorGroup, navigate }) => {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 group-hover:text-amber-700',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 group-hover:text-rose-700',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 group-hover:text-indigo-700',
    slate: 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 group-hover:text-slate-700',
  };

  const badgeMap = {
    amber: count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400',
    rose: count > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400',
    indigo: count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400',
    slate: count > 0 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400',
  };

  const style = colorMap[colorGroup] || colorMap.slate;
  const badgeStyle = badgeMap[colorGroup] || badgeMap.slate;

  return (
    <button
      onClick={() => navigate(route)}
      className="w-full flex items-center justify-between p-4 rounded-xl border border-transparent bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 group text-left mb-3"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border ${style} transition-colors`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${badgeStyle} transition-colors`}>
          {count}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
};

const EnhancedStatCard = ({ title, value, subtitle, icon, trend, gradient }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradient}`}>
    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10" />
    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10" />
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-4xl font-extrabold tracking-tight mb-2">{value}</h3>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="flex items-center bg-white/20 px-2 py-0.5 rounded-full">
            {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
            {trend > 0 ? `+${trend}%` : trend}%
          </span>
          <span className="text-white/70">{subtitle}</span>
        </div>
      </div>
      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

export default function HRDashboard() {
  const [payrollThisMonth, setPayrollThisMonth] = useState(0);
  const navigate = useNavigate();

  const results = useQueries({
    queries: [
      { queryKey: ['employees'], queryFn: getAllEmployees },
      { queryKey: ['jobs'], queryFn: () => fetchAllJobOpenings().then(r => r.data) },
      { queryKey: ['hrTickets'], queryFn: () => axiosInstance.get('/api/hr/tickets').then(r => r.data) },
      { queryKey: ['offboarding'], queryFn: () => axiosInstance.get('/api/hr/offboarding').then(r => r.data) },
      { queryKey: ['hiringStats'], queryFn: () => fetchHiringStats().then(r => r.data) }
    ],
  });

  const { data: pendingLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['pendingLeaveRequests'],
    queryFn: getPendingLeaveRequests,
  });

  const [employeesQ, jobsQ, ticketsQ, offboardingQ, hiringStatsQ] = results;
  const isLoading = results.some((r) => r.isLoading) || leavesLoading;

  // Data processing
  const employees = employeesQ.data || [];
  const headcount = employees.length;
  
  const openJobs = (jobsQ.data || []).filter((j) => j.jobOpening?.status === 'OPEN').length;
  const openGrievances = (ticketsQ.data || []).filter((g) => g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
  const activeOffboarding = (offboardingQ.data || []).filter((o) => o.status !== 'COMPLETED').length;

  // Department Distribution Data
  const deptData = useMemo(() => {
    if (!employees.length) return [];
    const counts = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [employees]);

  // Hiring Funnel Data
  const hiringData = useMemo(() => {
    const stats = hiringStatsQ.data;
    if (!stats || !stats.byStage) return [];
    
    return [
      { name: 'Applied', candidates: stats.byStage.APPLIED || 0 },
      { name: 'Shortlisted', candidates: stats.byStage.SHORTLISTED || 0 },
      { name: 'Interviewing', candidates: stats.byStage.INTERVIEWING || 0 },
      { name: 'Offered', candidates: stats.byStage.OFFERED || 0 },
      { name: 'Accepted', candidates: stats.byStage.ACCEPTED || 0 }
    ].filter(s => s.candidates > 0);
  }, [hiringStatsQ.data]);

  if (isLoading) {
    return (
      <div className="p-8 h-full flex flex-col gap-6 animate-pulse bg-slate-50">
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
          <div className="lg:col-span-1 h-96 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">HR Command Center</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time overview of your workforce operations</p>
          </div>
          <button 
            onClick={() => navigate('/hiring/jobs')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Briefcase className="w-5 h-5" />
            <span>Post New Job</span>
          </button>
        </div>

        {/* Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedStatCard
            title="Total Headcount"
            value={headcount}
            subtitle="Active employees"
            trend={4.2}
            icon={<Users className="w-8 h-8 text-white" />}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <EnhancedStatCard
            title="Active Job Openings"
            value={openJobs}
            subtitle="Recruitment pipeline"
            trend={12.5}
            icon={<Briefcase className="w-8 h-8 text-white" />}
            gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
          />
          <EnhancedStatCard
            title="Open Grievances"
            value={openGrievances}
            subtitle="Requires attention"
            trend={-2.1}
            icon={<AlertTriangle className="w-8 h-8 text-white" />}
            gradient="bg-gradient-to-br from-rose-400 to-red-600"
          />
          <EnhancedStatCard
            title="Payroll Est."
            value={payrollThisMonth > 0 ? `$${(payrollThisMonth / 1000).toFixed(1)}k` : '--'}
            subtitle="Current month"
            trend={1.8}
            icon={<CircleDollarSign className="w-8 h-8 text-white" />}
            gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          />
        </div>

        {/* Payroll Band */}
        <div className="w-full">
          <PayrollStatusBand onPayrollDataLoaded={setPayrollThisMonth} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Analytics */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Department Distribution */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-blue-500" />
                  Headcount by Department
                </h3>
                <div className="h-64">
                  {deptData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deptData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {deptData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No department data</div>
                  )}
                </div>
              </div>

              {/* Hiring Funnel */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Active Hiring Pipeline
                </h3>
                <div className="h-64">
                  {hiringData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hiringData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} width={85} />
                        <Tooltip
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="candidates" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                          {hiringData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No active hiring data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Directory Quick View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    Recently Onboarded
                  </h3>
                  <button onClick={() => navigate('/directory')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    View All <ArrowUpRight className="w-4 h-4" />
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                       <th className="pb-3 font-semibold">Employee</th>
                       <th className="pb-3 font-semibold">Role</th>
                       <th className="pb-3 font-semibold">Department</th>
                       <th className="pb-3 font-semibold text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {employees.slice(0, 4).map((emp, i) => (
                       <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/directory/${emp.id}`)}>
                         <td className="py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                               {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                             </div>
                             <div>
                               <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.firstName} {emp.lastName}</p>
                               <p className="text-xs text-slate-500">{emp.email}</p>
                             </div>
                           </div>
                         </td>
                         <td className="py-4 text-sm text-slate-700 font-medium">{emp.position || 'N/A'}</td>
                         <td className="py-4 text-sm text-slate-600">{emp.department || 'N/A'}</td>
                         <td className="py-4 text-right">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                             Active
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {employees.length === 0 && (
                   <div className="text-center py-8 text-slate-400 text-sm">No employees found.</div>
                 )}
               </div>
            </div>

          </div>

          {/* Right Column: Action Queue */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <h2 className="text-xl font-black tracking-tight relative z-10">Action Queue</h2>
                <p className="text-slate-300 text-sm font-medium mt-1 relative z-10">Items requiring HR attention</p>
              </div>
              
              <div className="p-5 bg-slate-50/50 flex-1 flex flex-col gap-1">
                <ActionRow
                  navigate={navigate}
                  icon={<CalendarClock className="w-6 h-6" />}
                  title="Leave Approvals"
                  subtitle="Pending employee requests"
                  count={pendingLeaves.length}
                  route="/approvals"
                  colorGroup="amber"
                />
                
                <ActionRow
                  navigate={navigate}
                  icon={<Ticket className="w-6 h-6" />}
                  title="Grievance Tickets"
                  subtitle="Unresolved helpdesk items"
                  count={openGrievances}
                  route="/hr/helpdesk"
                  colorGroup="rose"
                />
                
                <ActionRow
                  navigate={navigate}
                  icon={<Briefcase className="w-6 h-6" />}
                  title="Job Openings"
                  subtitle="Currently active listings"
                  count={openJobs}
                  route="/hiring/jobs"
                  colorGroup="indigo"
                />
                
                <ActionRow
                  navigate={navigate}
                  icon={<UserMinus className="w-6 h-6" />}
                  title="Offboarding"
                  subtitle="Processes in progress"
                  count={activeOffboarding}
                  route="/hr/offboarding"
                  colorGroup="slate"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
