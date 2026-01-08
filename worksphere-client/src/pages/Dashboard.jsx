import { useNavigate } from 'react-router-dom';
import AttendanceControl from '../features/attendance/AttendanceControls';

const Dashboard = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('../auth/Login');
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>Employee Workspace</h1>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className="card">
        <div>
          <AttendanceControl />
        </div>
        {/* <div>
          <AttendanceWidget />
        </div> */}
      </main>
    </div>
  );
};

export default Dashboard;
