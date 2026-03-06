import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function NavBar() {
  const { user, logout } = useAuth();

  const userRoles = (user?.roles || []).map((r) =>
    r.replace('ROLE_', '').toUpperCase()
  );

  const hasManagerAccess =
    userRoles.includes('MANAGER') ||
    userRoles.includes('HR') ||
    userRoles.includes('ADMIN');

  const hasAdminAccess =
    userRoles.includes('ADMIN') || userRoles.includes('HR');

  const linkStyle =
    'text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1 rounded transition';

  return (
    <nav className="flex items-center gap-2 bg-gray-900 px-6 py-3 shadow-md">
      <Link to="/dashboard" className={linkStyle}>
        Home
      </Link>
      <Link to="/tasks" className={linkStyle}>
        Task Board
      </Link>
      <Link to="/profile" className={linkStyle}>
        Profile
      </Link>
      <Link to="/leave" className={linkStyle}>
        Leave
      </Link>

      {/* Tier 1.5: Managers and above */}
      {hasManagerAccess && (
        <>
          <Link to="/roster" className={linkStyle}>
            Live Roster
          </Link>
          <Link to="/approvals" className={linkStyle}>
            Approvals
          </Link>
        </>
      )}

      {/* Tier 2: HR & Admins only */}
      {hasAdminAccess && (
        <>
          <Link to="/departments" className={linkStyle}>
            Add Department
          </Link>
          <Link to="/roles" className={linkStyle}>
            Add Roles
          </Link>
          <Link to="/jobPosition" className={linkStyle}>
            Add Job Position
          </Link>
          <Link to="/register" className={linkStyle}>
            Add new Employee
          </Link>
          <Link to="/leave-policies" className={linkStyle}>
            Leave Policies
          </Link>
          <Link to="/leave-override" className={linkStyle}>
            Balance Override
          </Link>
          <Link to="/holidays" className={linkStyle}>
            Public Holidays
          </Link>
          <Link to="/work-schedules" className={linkStyle}>
            Work Schedules
          </Link>
        </>
      )}

      <button
        onClick={logout}
        className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded transition"
      >
        Logout
      </button>
    </nav>
  );
}
