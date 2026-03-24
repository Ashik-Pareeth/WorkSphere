import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { getAllEmployees } from '../../api/employeeApi';
import axiosInstance from '../../api/axiosInstance';
import {
  Users,
  Shield,
  Settings,
  UserPlus,
  Building2,
  Calendar,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const [headcount, setHeadcount] = useState(0);
  const [rolesCount, setRolesCount] = useState(0);
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [pendingOnboardings, setPendingOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSystemStats = async () => {
      setLoading(true);
      try {
        const [empRes, rolesRes, deptRes] = await Promise.all([
          getAllEmployees().catch(() => []),
          axiosInstance.get('/roles').catch(() => ({ data: [] })),
          axiosInstance.get('/departments').catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          const employees = empRes || [];
          setHeadcount(employees.length);

          const pending = employees.filter(
            (e) => e.status === 'PENDING' || e.employeeStatus === 'PENDING'
          );
          setPendingOnboardings(pending.slice(0, 5));

          const roles = rolesRes?.data || [];
          setRolesCount(roles.length || 5);

          const depts = deptRes?.data || [];
          setDepartmentsCount(depts.length);
        }
      } catch (error) {
        console.error('Failed to load SuperAdmin stats', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSystemStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const ConfigLink = ({ to, icon, title, desc }) => (
    <Link
      to={to}
      className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="p-3 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight
        size={18}
        className="text-gray-300 group-hover:text-blue-500 transition-colors"
      />
    </Link>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 w-full overflow-y-auto">
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          System Administration
        </h1>

        {/* TOP METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Accounts"
            value={loading ? '--' : headcount}
            icon={<Users className="w-6 h-6" />}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="System Roles"
            value={loading ? '--' : rolesCount}
            icon={<Shield className="w-6 h-6" />}
            colorClass="text-indigo-600"
            bgColorClass="bg-indigo-50/40"
          />
          <StatCard
            title="Pending Activation"
            value={loading ? '--' : pendingOnboardings.length}
            icon={<UserPlus className="w-6 h-6" />}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
          <StatCard
            title="Departments"
            value={loading ? '--' : departmentsCount}
            icon={<Building2 className="w-6 h-6" />}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: QUICK CONFIG LINKS */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
              <Settings size={20} className="text-gray-500" />
              Quick Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConfigLink
                to="/departments"
                icon={<Building2 />}
                title="Departments"
                desc="Manage org segments"
              />
              <ConfigLink
                to="/role-management"
                icon={<Shield />}
                title="Role Allocation"
                desc="Assign user permissions"
              />
              <ConfigLink
                to="/work-schedules"
                icon={<Calendar />}
                title="Work Schedules"
                desc="Configure shift timings"
              />
              <ConfigLink
                to="/leave-policies"
                icon={<FileText />}
                title="Leave Policies"
                desc="Adjust accrual rules"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: RECENT ONBOARDINGS */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <UserPlus size={20} className="text-gray-500" />
              Pending Onboardings
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-500 animate-pulse">
                  Loading queue...
                </div>
              ) : pendingOnboardings.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No pending accounts. All clear!
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingOnboardings.map((emp, i) => (
                    <div
                      key={i}
                      className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs uppercase">
                          {emp.firstName ? emp.firstName[0] : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-gray-500 uppercase tracking-widest">
                            {emp.createdAt
                              ? new Date(emp.createdAt).toLocaleDateString()
                              : 'Awaiting Activation'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
