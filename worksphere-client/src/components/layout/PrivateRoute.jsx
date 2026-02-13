import { Navigate, Outlet, useLocation } from 'react-router-dom';

const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem('token'); // optional cleanup
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const PrivateRoute = () => {
  const location = useLocation();

  return isTokenValid() ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace state={{ from: location }} />
  );
};

export default PrivateRoute;
