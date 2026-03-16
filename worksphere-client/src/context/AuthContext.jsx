import { createContext, useState } from 'react';

// Tell Vite's Fast Refresh it is safe to export this Context object
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

/**
 * Validate JWT expiration
 */
const checkTokenValidity = (token) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Build UI-friendly role flags from role list
 */
const buildRoleFlags = (roles = []) => ({
  isGlobalAdmin: roles.includes('SUPER_ADMIN'),
  isHR: roles.includes('HR'),
  isManager: roles.includes('MANAGER'),
  isEmployee: roles.includes('EMPLOYEE'),
  isAuditor: roles.includes('AUDITOR'),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');
    const storedRolesStr = localStorage.getItem('roles');
    const status = localStorage.getItem('status');

    // Hydrate only if token exists and is valid
    if (token && employeeId && checkTokenValidity(token)) {
      try {
        const roles = JSON.parse(storedRolesStr || '[]');

        return {
          id: employeeId,
          status,
          roles,
          ...buildRoleFlags(roles),
        };
      } catch (error) {
        console.error('Failed to parse auth data from localStorage', error);
        return null;
      }
    }

    // Token expired or missing → clean auth keys
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('roles');
    localStorage.removeItem('status');

    return null;
  });

  const [loading] = useState(false);

  /**
   * Handle login success
   */
  const handleLogin = (authData) => {
    const roles = authData.roles || [];

    localStorage.setItem('token', authData.token);
    localStorage.setItem('employeeId', authData.employeeId);
    localStorage.setItem('roles', JSON.stringify(roles));
    localStorage.setItem('status', authData.status);

    setUser({
      id: authData.employeeId,
      status: authData.status,
      roles,
      ...buildRoleFlags(roles),
    });
  };

  /**
   * Logout user
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('roles');
    localStorage.removeItem('status');

    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
