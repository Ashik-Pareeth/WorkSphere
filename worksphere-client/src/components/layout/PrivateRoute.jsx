import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Adjust path!
import NavBar from './NavBar';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // 1. ALL HOOKS MUST GO AT THE TOP!
  // Move the safety catch here before any early returns
  useEffect(() => {
    if (user && user.status !== 'ACTIVE' && user.status !== 'PENDING') {
      logout();
    }
  }, [user, logout]);

  // 2. Wait for AuthContext to finish loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 font-medium text-sm">
          Verifying Session...
        </div>
      </div>
    );
  }

  // 3. Not logged in (or token expired)? Kick them to login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 4. Needs Onboarding?
  if (user.status === 'PENDING' && location.pathname !== '/onBoarding') {
    return <Navigate to="/onBoarding" replace />;
  }

  // 5. Check if they were logged out by the useEffect safety catch
  if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
    return <Navigate to="/login" replace />;
  }

  // 6. Bulletproof Role-Based Access Control
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
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 7. User is valid, active, and authorized. Render the UI!
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

export default PrivateRoute;
