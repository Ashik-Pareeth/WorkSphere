import { createContext, useState } from 'react';

// Tell Vite's Fast Refresh it is safe to export this Context object
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');
    const storedRolesStr = localStorage.getItem('roles');
    const status = localStorage.getItem('status'); // Grab status directly!

    // If we have a token AND an employeeId, we consider them logged in
    if (token && employeeId) {
      try {
        const parsedRoles = JSON.parse(storedRolesStr || '[]');

        // Build the user state from your flat local storage keys
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
        localStorage.clear();
        return null;
      }
    }
    return null;
  });

  const [loading] = useState(false);

  const handleLogin = (authData) => {
    // Save to storage using your flat structure
    localStorage.setItem('token', authData.token);
    localStorage.setItem('employeeId', authData.employeeId);
    localStorage.setItem('roles', JSON.stringify(authData.roles));
    localStorage.setItem('status', authData.status);

    // Update React State
    setUser({
      id: authData.employeeId,
      status: authData.status,
      roles: authData.roles,
      isGlobalAdmin: authData.roles.some((r) =>
        ['ROLE_ADMIN', 'ADMIN'].includes(r)
      ),
      isHR: authData.roles.some((r) => ['ROLE_HR', 'HR'].includes(r)),
      isExecutive: authData.roles.some((r) => ['ROLE_EXECUTIVE'].includes(r)),
      isManager: authData.roles.some((r) => ['ROLE_MANAGER'].includes(r)),
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login: handleLogin, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
