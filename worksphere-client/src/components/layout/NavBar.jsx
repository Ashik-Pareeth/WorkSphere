import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function NavBar() {
  const { user, logout } = useAuth();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const userRoles = (user?.roles || []).map((r) =>
    r.replace('ROLE_', '').toUpperCase()
  );

  const hasManagerAccess =
    userRoles.includes('MANAGER') ||
    userRoles.includes('HR') ||
    userRoles.includes('SUPER_ADMIN');

  const hasAdminAccess =
    userRoles.includes('SUPER_ADMIN') || userRoles.includes('HR');

  // NavLink automatically passes an isActive boolean
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-800 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Brand & Main Employee Links */}
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
                <NavLink to="/leave" className={linkClass}>
                  Leave
                </NavLink>
                <NavLink to="/my-compensation" className={linkClass}>
                  Compensation
                </NavLink>

                {/* Tier 1.5: Managers and above */}
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

          {/* Right Side - Admin Dropdown & Profile/Logout */}
          <div className="flex items-center gap-4">
            {/* Tier 2: HR & SUPER_ADMINS Dropdown */}
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

                {/* Dropdown Menu */}
                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Organization
                      </div>
                      <NavLink
                        to="/departments"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Departments
                      </NavLink>
                      <NavLink
                        to="/roles"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Permission Roles
                      </NavLink>
                      {userRoles.includes('SUPER_ADMIN') && (
                        <NavLink
                          to="/role-management"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 font-medium"
                        >
                          User Role Allocation
                        </NavLink>
                      )}
                      <NavLink
                        to="/jobPosition"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Job Positions
                      </NavLink>

                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-t border-gray-100">
                        HR Operations
                      </div>
                      <NavLink
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Onboard Employee
                      </NavLink>
                      <NavLink
                        to="/hiring/jobs"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-semibold text-blue-600"
                      >
                        Recruitment Hub
                      </NavLink>
                      <NavLink
                        to="/hr/payroll"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Payroll
                      </NavLink>

                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-t border-gray-100">
                        Leave & Schedule
                      </div>
                      <NavLink
                        to="/leave-policies"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Leave Policies
                      </NavLink>
                      <NavLink
                        to="/leave-override"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Adjust Balances
                      </NavLink>
                      <NavLink
                        to="/holidays"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Public Holidays
                      </NavLink>
                      <NavLink
                        to="/work-schedules"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Work Schedules
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
            )}

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

