import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Note: Adjust this path to where you saved useAuth.js!
import NavBar from './NavBar';

// Your strict JWT expiration checker
const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.clear(); // Clean up everything if expired
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthContext to finish loading from local storage
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 font-medium text-sm">
          Verifying Session...
        </div>
      </div>
    );
  }

  // 2. Not logged in OR token is expired? Kick them to the login screen
  if (!user || !isTokenValid()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 3. Needs Onboarding? (Fixes your undefined status bug!)
  // We also make sure they aren't already ON the onboarding page to prevent an infinite redirect loop.
  if (user.status === 'PENDING' && location.pathname !== '/onBoarding') {
    return <Navigate to="/onBoarding" replace />;
  }

  // 4. Role-Based Access Control (From the Blueprint)
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) =>
      user.roles.includes(role)
    );
    if (!hasRequiredRole) {
      console.warn(`Access Denied: Missing required roles.`);
      // Send them to their main dashboard if they try to access a restricted URL
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 5. User is valid, active, and authorized. Render the UI!
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

export default PrivateRoute;
