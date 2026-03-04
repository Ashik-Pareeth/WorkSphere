import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Adjust path!
import NavBar from './NavBar';

const PrivateRoute = ({ allowedRoles = [] }) => {
  // We grab the new isAuthenticated boolean directly from the domain layer
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthContext to finish loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 font-medium text-sm">
          Verifying Session...
        </div>
      </div>
    );
  }

  // 2. Not logged in (or token expired)? Kick them to login.
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 3. Needs Onboarding?
  if (user.status === 'PENDING' && location.pathname !== '/onBoarding') {
    return <Navigate to="/onBoarding" replace />;
  }

  // 4. Safety catch for Suspended/Terminated accounts
  if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
    // Ideally redirect to an "account-disabled" page, or just log them out
    logout();
    return <Navigate to="/" replace />;
  }

  // 5. Bulletproof Role-Based Access Control
  if (allowedRoles.length > 0) {
    // Safety fallback || [] prevents map() crashes
    const cleanUserRoles = (user.roles || []).map((r) =>
      r.replace('ROLE_', '').toUpperCase()
    );

    const hasRequiredRole = allowedRoles.some((role) =>
      cleanUserRoles.includes(role.toUpperCase())
    );

    if (!hasRequiredRole) {
      console.warn(`Access Denied: Missing required roles.`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 6. User is valid, active, and authorized. Render the UI!
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

export default PrivateRoute;
