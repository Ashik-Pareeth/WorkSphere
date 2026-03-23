import { useAuth } from '../hooks/useAuth';
import HRDashboard from './dashboards/HRDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import AuditorDashboard from './dashboards/AuditorDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';

const ROLE_PRIORITY = ['SUPER_ADMIN', 'HR', 'MANAGER', 'AUDITOR', 'EMPLOYEE'];

function getHighestRole(roles = []) {
  if (!roles || roles.length === 0) return 'EMPLOYEE';
  const normalized = roles.map((r) => r.replace('ROLE_', '').toUpperCase());
  for (const role of ROLE_PRIORITY) {
    if (normalized.includes(role)) return role;
  }
  return 'EMPLOYEE';
}

const roleDashboardMap = {
  SUPER_ADMIN: <SuperAdminDashboard />,
  HR: <HRDashboard />,
  MANAGER: <ManagerDashboard />,
  AUDITOR: <AuditorDashboard />,
  EMPLOYEE: <EmployeeDashboard />,
};

const Dashboard = () => {
  const { user } = useAuth();
  const highestRole = getHighestRole(user?.roles);

  return roleDashboardMap[highestRole] || <EmployeeDashboard />;
};

export default Dashboard;
