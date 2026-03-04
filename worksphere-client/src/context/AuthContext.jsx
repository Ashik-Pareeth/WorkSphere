import { createContext, useState } from 'react';

// Tell Vite's Fast Refresh it is safe to export this Context object
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

// Enterprise-grade token validation helper
const checkTokenValidity = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');
    const storedRolesStr = localStorage.getItem('roles');
    const status = localStorage.getItem('status');

    // ONLY hydrate the user if the token actually exists AND is still valid!
    if (token && employeeId && checkTokenValidity(token)) {
      try {
        const parsedRoles = JSON.parse(storedRolesStr || '[]');

        return {
          id: employeeId,
          status: status,
          roles: parsedRoles,
          isGlobalAdmin: parsedRoles.some((r) =>
            ['ROLE_ADMIN', 'ADMIN'].includes(r)
          ),
          isHR: parsedRoles.some((r) => ['ROLE_HR', 'HR'].includes(r)),
          isExecutive: parsedRoles.some((r) => ['ROLE_EXECUTIVE'].includes(r)),
          isManager: parsedRoles.some((r) => ['ROLE_MANAGER'].includes(r)),
        };
      } catch (error) {
        console.error('Failed to parse auth data from local storage', error);
        return null;
      }
    }

    // If we reach here, the token is expired or missing.
    // Clean up targeted auth keys just in case, but DO NOT use localStorage.clear()
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('roles');
    localStorage.removeItem('status');
    return null;
  });

  const [loading] = useState(false);

  const handleLogin = (authData) => {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('employeeId', authData.employeeId);
    localStorage.setItem('roles', JSON.stringify(authData.roles));
    localStorage.setItem('status', authData.status);

    setUser({
      id: authData.employeeId,
      status: authData.status,
      roles: authData.roles || [],
      isGlobalAdmin: authData.roles.some((r) =>
        ['ROLE_ADMIN', 'ADMIN'].includes(r)
      ),
      isHR: authData.roles.some((r) => ['ROLE_HR', 'HR'].includes(r)),
      isExecutive: authData.roles.some((r) => ['ROLE_EXECUTIVE'].includes(r)),
      isManager: authData.roles.some((r) => ['ROLE_MANAGER'].includes(r)),
    });
  };

  const handleLogout = () => {
    // Targeted removal protects other app data (like theme=dark or cached filters)
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('roles');
    localStorage.removeItem('status');
    setUser(null);
  };

  // The golden flag for the UI layer
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
