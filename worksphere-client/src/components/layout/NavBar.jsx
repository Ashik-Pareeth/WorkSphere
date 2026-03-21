import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';

// Role hierarchy: higher index = lower priority
const ROLE_PRIORITY = ['SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

function getHighestRole(roles = []) {
  const normalized = roles.map((r) => r.replace('ROLE_', '').toUpperCase());
  for (const role of ROLE_PRIORITY) {
    if (normalized.includes(role)) return role;
  }
  return 'EMPLOYEE';
}

export default function NavBar() {
  const { user, logout } = useAuth();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const highestRole = getHighestRole(user?.roles);

  const hasManagerAccess =
    highestRole === 'MANAGER' ||
    highestRole === 'HR' ||
    highestRole === 'SUPER_ADMIN';

  const hasAdminAccess = highestRole === 'HR' || highestRole === 'SUPER_ADMIN';

  const isSuperAdmin = highestRole === 'SUPER_ADMIN';

  // Top nav links
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-800 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  // Dropdown links inside the admin menu
  const dropdownLinkClass = ({ isActive }) =>
    `block px-4 py-2 text-sm transition-colors border-l-2 ${
      isActive
        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
        : 'border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
    }`;

  // Super-admin-only dropdown link (red accent)
  const superAdminDropdownLinkClass = ({ isActive }) =>
    `block px-4 py-2 text-sm font-medium transition-colors border-l-2 ${
      isActive
        ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
        : 'border-transparent text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Brand & Main Links */}
          <div className="flex items-center">
            <div className="shrink-0 text-white font-bold text-xl tracking-wider">
              WorkSphere
            </div>
            <div className="hidden md:block ml-8">
              <div className="flex items-baseline space-x-2">
                <NavLink to="/dashboard" className={linkClass}>
                  Home
                </NavLink>
                <NavLink to="/tasks" className={linkClass}>
                  My Tasks
                </NavLink>
                <NavLink to="/attendance-log" className={linkClass}>
                  Attendance
                </NavLink>
                <NavLink to="/leave" className={linkClass}>
                  Leave
                </NavLink>
                <NavLink to="/my-compensation" className={linkClass}>
                  Compensation
                </NavLink>
                <NavLink to="/my-assets" className={linkClass}>
                  My Assets
                </NavLink>
                <NavLink to="/helpdesk" className={linkClass}>
                  Helpdesk
                </NavLink>

                {/* MANAGER and above */}
                {hasManagerAccess && (
                  <>
                    <div className="w-px h-5 bg-gray-700 mx-2 inline-block align-middle" />
                    <NavLink to="/roster" className={linkClass}>
                      Team Roster
                    </NavLink>
                    <NavLink to="/approvals" className={linkClass}>
                      Approvals
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* HR & SUPER_ADMIN Dropdown */}
            {hasAdminAccess && (
              <div className="relative">
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  onBlur={() =>
                    setTimeout(() => setIsAdminMenuOpen(false), 200)
                  }
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  Administration
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="py-1">
                      {/* ── Organization ── */}
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Organization
                      </div>
                      <NavLink to="/departments" className={dropdownLinkClass}>
                        Departments
                      </NavLink>

                      {/* SUPER_ADMIN only */}
                      {isSuperAdmin && (
                        <>
                          {' '}
                          <NavLink
                            to="/role-management"
                            className={superAdminDropdownLinkClass}
                          >
                            User Role Allocation
                          </NavLink>
                          <NavLink to="/register" className={dropdownLinkClass}>
                            Onboard Employee
                          </NavLink>
                          <NavLink to="/roles" className={dropdownLinkClass}>
                            Permission Roles
                          </NavLink>
                        </>
                      )}

                      <NavLink to="/jobPosition" className={dropdownLinkClass}>
                        Job Positions
                      </NavLink>

                      {/* ── HR Operations ── */}
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-t border-gray-100">
                        HR Operations
                      </div>

                      <NavLink
                        to="/employee-list"
                        className={dropdownLinkClass}
                      >
                        Employee List
                      </NavLink>
                      <NavLink to="/hiring/jobs" className={dropdownLinkClass}>
                        Recruitment Hub
                      </NavLink>
                      <NavLink to="/hr/payroll" className={dropdownLinkClass}>
                        Payroll
                      </NavLink>

                      {/* ADD THESE NEW LINKS HERE 👇 */}
                      <NavLink to="/hr/assets" className={dropdownLinkClass}>
                        Asset Directory
                      </NavLink>
                      <NavLink to="/hr/helpdesk" className={dropdownLinkClass}>
                        HR Helpdesk
                      </NavLink>
                      <NavLink
                        to="/hr/appraisals"
                        className={dropdownLinkClass}
                      >
                        Appraisals
                      </NavLink>
                      <NavLink
                        to="/hr/offboarding"
                        className={dropdownLinkClass}
                      >
                        Offboarding
                      </NavLink>

                      {/* ── Leave & Schedule ── */}
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-t border-gray-100">
                        Leave & Schedule
                      </div>
                      <NavLink
                        to="/leave-policies"
                        className={dropdownLinkClass}
                      >
                        Leave Policies
                      </NavLink>
                      <NavLink
                        to="/leave-override"
                        className={dropdownLinkClass}
                      >
                        Adjust Balances
                      </NavLink>
                      <NavLink to="/holidays" className={dropdownLinkClass}>
                        Public Holidays
                      </NavLink>
                      <NavLink
                        to="/work-schedules"
                        className={dropdownLinkClass}
                      >
                        Work Schedules
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
            )}

            <NotificationBell />

            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>

            <button
              onClick={logout}
              className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
