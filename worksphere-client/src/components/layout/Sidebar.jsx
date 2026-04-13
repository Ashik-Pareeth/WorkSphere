import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  CalendarRange,
  Banknote,
  Package,
  HeartHandshake,
  Star,
  Users,
  CheckCircle,
  Briefcase,
  Building2,
  Calendar,
  Settings,
  UserPlus,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Landmark,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const toggleSidebar = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem('sidebarCollapsed', newVal.toString());
  };

  const hasRole = (roles) => {
    if (!user || !user.roles) return false;
    const userRoles = user.roles.map((r) => r.replace('ROLE_', '').toUpperCase());
    return roles.some((r) => userRoles.includes(r.toUpperCase()));
  };

  const isManagerStrict = hasRole(['MANAGER']);
  const isHrOrAbove = hasRole(['HR', 'SUPER_ADMIN']);
  const isSuperAdmin = hasRole(['SUPER_ADMIN']);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-1 ${
      isActive
        ? 'bg-blue-600 font-medium text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    } ${collapsed ? 'justify-center' : ''}`;

  const renderSectionHeader = (title) => {
    if (collapsed) return <div className="h-6" />; // Spacing when collapsed
    return (
      <div className="px-3 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
    );
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } flex-shrink-0 bg-[#0a0f1c] border-r border-gray-800 transition-all duration-300 h-screen flex flex-col z-20`}
    >
      {/* Brand area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-wider font-sora truncate">
            WorkSphere
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <div className="px-2">
          {/* EVERYONE */}
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={18} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          
          <NavLink to="/tasks" className={navLinkClass}>
            <CheckSquare size={18} />
            {!collapsed && <span>My Tasks</span>}
          </NavLink>
          <NavLink to="/bulletin" className={navLinkClass}>
            <Star size={18} />
            {!collapsed && <span>Bulletin Board</span>}
          </NavLink>
          <NavLink to="/attendance-log" className={navLinkClass}>
            <Clock size={18} />
            {!collapsed && <span>Attendance</span>}
          </NavLink>
          <NavLink to="/leave" className={navLinkClass}>
            <CalendarRange size={18} />
            {!collapsed && <span>Leave</span>}
          </NavLink>
          <NavLink to="/my-compensation" className={navLinkClass}>
            <Banknote size={18} />
            {!collapsed && <span>Compensation</span>}
          </NavLink>
          <NavLink to="/my-assets" className={navLinkClass}>
            <Package size={18} />
            {!collapsed && <span>My Assets</span>}
          </NavLink>
          <NavLink to="/helpdesk" className={navLinkClass}>
            <HeartHandshake size={18} />
            {!collapsed && <span>Helpdesk</span>}
          </NavLink>
          <NavLink to="/my-appraisals" className={navLinkClass}>
            <Star size={18} />
            {!collapsed && <span>My Appraisals</span>}
          </NavLink>

          {/* MANAGER ONLY */}
          {isManagerStrict && (
            <>
              {renderSectionHeader('Management')}
              <NavLink to="/roster" className={navLinkClass}>
                <Users size={18} />
                {!collapsed && <span>Team Roster</span>}
              </NavLink>
              <NavLink to="/team-attendance" className={navLinkClass}>
                <Clock size={18} />
                {!collapsed && <span>Team Attendance</span>}
              </NavLink>
              <NavLink to="/approvals" className={navLinkClass}>
                <CheckCircle size={18} />
                {!collapsed && <span>Approvals</span>}
              </NavLink>
              <NavLink to="/team-appraisals" className={navLinkClass}>
                <ClipboardList size={18} />
                {!collapsed && <span>Team Appraisals</span>}
              </NavLink>
            </>
          )}

          {/* HR & SUPER_ADMIN */}
          {isHrOrAbove && (
            <>
              {renderSectionHeader('HR Operations')}
              <NavLink to="/hr/roster" className={navLinkClass}>
                <Users size={18} />
                {!collapsed && <span>Company Live Roster</span>}
              </NavLink>
              <NavLink to="/employee-list" className={navLinkClass}>
                <Users size={18} />
                {!collapsed && <span>Employee Directory</span>}
              </NavLink>
              <NavLink to="/hr/leave-approvals" className={navLinkClass}>
                <CheckCircle size={18} />
                {!collapsed && <span>Global Leave Approvals</span>}
              </NavLink>
              <NavLink to="/hr/attendance-log" className={navLinkClass}>
                <Clock size={18} />
                {!collapsed && <span>Global Attendance</span>}
              </NavLink>
              <NavLink to="/hiring/jobs" className={navLinkClass}>
                <Briefcase size={18} />
                {!collapsed && <span>Recruitment</span>}
              </NavLink>
              <NavLink to="/hr/payroll" className={navLinkClass}>
                <Landmark size={18} />
                {!collapsed && <span>Payroll</span>}
              </NavLink>
              <NavLink to="/hr/assets" className={navLinkClass}>
                <Package size={18} />
                {!collapsed && <span>Asset Directory</span>}
              </NavLink>
              <NavLink to="/hr/helpdesk" className={navLinkClass}>
                <HeartHandshake size={18} />
                {!collapsed && <span>HR Helpdesk</span>}
              </NavLink>
              <NavLink to="/hr/appraisals" className={navLinkClass}>
                <Star size={18} />
                {!collapsed && <span>Appraisals</span>}
              </NavLink>
              <NavLink to="/hr/offboarding" className={navLinkClass}>
                <LogOut size={18} />
                {!collapsed && <span>Offboarding</span>}
              </NavLink>

              {renderSectionHeader('Configuration')}
              <NavLink to="/departments" className={navLinkClass}>
                <Building2 size={18} />
                {!collapsed && <span>Departments</span>}
              </NavLink>
              <NavLink to="/jobPosition" className={navLinkClass}>
                <Briefcase size={18} />
                {!collapsed && <span>Job Positions</span>}
              </NavLink>
              <NavLink to="/leave-policies" className={navLinkClass}>
                <CalendarRange size={18} />
                {!collapsed && <span>Leave Policies</span>}
              </NavLink>
              <NavLink to="/leave-override" className={navLinkClass}>
                <Settings size={18} />
                {!collapsed && <span>Leave Adjustments</span>}
              </NavLink>
              <NavLink to="/work-schedules" className={navLinkClass}>
                <Clock size={18} />
                {!collapsed && <span>Work Schedules</span>}
              </NavLink>
              <NavLink to="/holidays" className={navLinkClass}>
                <Calendar size={18} />
                {!collapsed && <span>Holidays</span>}
              </NavLink>
            </>
          )}

          {/* SUPER ADMIN ONLY */}
          {isSuperAdmin && (
            <>
              {renderSectionHeader('Super Admin')}
              <NavLink to="/register" className={navLinkClass}>
                <UserPlus size={18} />
                {!collapsed && <span>Onboard Employee</span>}
              </NavLink>
              <NavLink to="/role-management" className={navLinkClass}>
                <ShieldAlert size={18} />
                {!collapsed && <span>Role Allocation</span>}
              </NavLink>
              <NavLink to="/roles" className={navLinkClass}>
                <Shield size={18} />
                {!collapsed && <span>Permission Roles</span>}
              </NavLink>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
