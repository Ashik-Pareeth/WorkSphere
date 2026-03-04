import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './NavBar.css';

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

  return (
    <nav className="navbar">
      <Link to={'/dashboard'}>Home</Link>
      <Link to={'/tasks'}>Task Board</Link>
      <Link to={'/profile'}>Profile</Link>
      <Link to={'/leave'}>Leave</Link>

      {/* Tier 1.5: Managers and above */}
      {hasManagerAccess && (
        <>
          <Link to={'/roster'}>Live Roster</Link>
          <Link to={'/approvals'}>Approvals</Link>
        </>
      )}

      {/* Tier 2: HR & Admins only */}
      {hasAdminAccess && (
        <>
          <Link to={'/departments'}>Add Department</Link>
          <Link to={'/roles'}>Add Roles</Link>
          <Link to={'/jobPosition'}>Add Job Position</Link>
          <Link to={'/register'}>Add new Employee</Link>
          <Link to={'/leave-policies'}>Leave Policies</Link>
          <Link to={'/leave-override'}>Balance Override</Link>
          <Link to={'/holidays'}>Public Holidays</Link>
          <Link to={'/work-schedules'}>Work Schedules</Link>
        </>
      )}

      <button
        onClick={logout}
        className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
      >
        Logout
      </button>
    </nav>
  );
}
