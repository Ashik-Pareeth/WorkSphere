import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // This runs EVERY time you try to access a protected route
  const isAuthenticated = !!localStorage.getItem('token');

  // If logged in, show the page (Outlet). If not, redirect to Login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
