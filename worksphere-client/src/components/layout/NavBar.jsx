import { Link } from 'react-router-dom';
import './NavBar.css';

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token', error);
    return null;
  }
};

export default function NavBar() {
  const token = localStorage.getItem('token');
  let userRoles = [];

  if (token) {
    const decodedToken = decodeJWT(token);

    userRoles = decodedToken?.roles || decodedToken?.authorities || [];

    if (typeof userRoles === 'string') {
      userRoles = [userRoles];
    }
  }

  const hasAdminAccess =
    userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_HR');

  return (
    <nav className="navbar">
      <Link to={'/'}>Home</Link>
      <Link to={'/tasks'}>Task Board</Link>

      {hasAdminAccess && (
        <>
          <Link to={'/departments'}>Add Department</Link>
          <Link to={'/roles'}>Add Roles</Link>
          <Link to={'/jobPosition'}>Add Job Position</Link>
          <Link to={'/register'}>Add new Employee</Link>
        </>
      )}
    </nav>
  );
}
