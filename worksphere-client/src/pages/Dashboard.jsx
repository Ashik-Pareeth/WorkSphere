import WorkTracker from '../features/attendance/WorkTracker';
import AttendanceWidget from '../features/attendance/AttendanceWidget';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
const Dashboard = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth/login');
  };
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Employee Workspace</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Logout
        </button>
      </header>
      <main className="dashboard-main">
        <div className="panel">
          <WorkTracker />
        </div>
        <div className="panel">
          <AttendanceWidget />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
