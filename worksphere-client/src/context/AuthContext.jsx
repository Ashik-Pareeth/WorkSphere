import { createContext, useState, useEffect } from 'react';
import { getMyProfile } from '../api/employeeApi';

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
  isGlobalAdmin:
    roles.includes('ROLE_SUPER_ADMIN') || roles.includes('SUPER_ADMIN'),
  isHR: roles.includes('ROLE_HR') || roles.includes('HR'),
  isManager: roles.includes('ROLE_MANAGER') || roles.includes('MANAGER'),
  isEmployee: roles.includes('ROLE_EMPLOYEE') || roles.includes('EMPLOYEE'),
  isAuditor: roles.includes('ROLE_AUDITOR') || roles.includes('AUDITOR'),
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

  const [loading, setLoading] = useState(true);

  // Fetch the profile once on mount if we hydrated a valid token
  useEffect(() => {
    let isMounted = true;
    const initProfile = async () => {
      if (user && user.id) {
        try {
          const profile = await getMyProfile();
          console.log('Fetched profile on startup:', profile); // Debugging line to check fetched profile data
          if (isMounted) {
            setUser((prev) => ({
              ...prev,
              firstName: profile.firstName,
              lastName: profile.lastName,
              profilePic: profile.profilePic,
              department: profile.department,
              designation: profile.jobTitle || null,
              workSchedule: profile.workSchedule || null,
              chatAnonymous: profile.chatAnonymous,
              anonymousAlias: profile.anonymousAlias,
            }));
          }
        } catch (error) {
          console.error('Failed to load user profile on startup', error);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initProfile();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle login success
   */
  const handleLogin = async (authData) => {
    const roles = authData.roles || [];

    localStorage.setItem('token', authData.token);
    localStorage.setItem('employeeId', authData.employeeId);
    localStorage.setItem('roles', JSON.stringify(roles));
    localStorage.setItem('status', authData.status);

    // Initial state to unblock UI
    setUser({
      id: authData.employeeId,
      status: authData.status,
      roles,
      ...buildRoleFlags(roles),
    });

    // Fetch full profile info in the background
    try {
      const profile = await getMyProfile();
      setUser((prev) => ({
        ...prev,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePic: profile.profilePic,
        department: profile.department,
        designation: profile.jobPosition?.title || null,
        chatAnonymous: profile.chatAnonymous,
        anonymousAlias: profile.anonymousAlias,
      }));
    } catch (err) {
      console.error('Failed to fetch profile during login', err);
    }
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
