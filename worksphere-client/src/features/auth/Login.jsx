import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  async function LoginValidation(e) {
    e.preventDefault();
    setError(null);

    localStorage.clear(); // cleaner

    try {
      const response = await axiosInstance.post('/login', {
        userName,
        password,
      });

      const token = response.data.token;

      // ✅ Decode token
      const decoded = jwtDecode(token);
      console.log('Decoded Token:', decoded);

      // ✅ Extract roles (supports all common formats)
      let roles = [];

      if (decoded.roles) {
        roles = decoded.roles;
      } else if (decoded.authorities) {
        roles = decoded.authorities;
      } else if (decoded.role) {
        roles = [decoded.role];
      }

      // ✅ Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('employeeId', response.data.employeeId);
      localStorage.setItem('roles', JSON.stringify(roles));

      // Optional → primary role shortcut
      localStorage.setItem('role', roles[0]);

      navigate('/');
    } catch (err) {
      console.error('Login failed', err);
      setError(err);
      setPassword('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
          <p className="text-sm text-slate-500">Please sign in to continue</p>
        </div>

        <AlertMessage error={error} onClose={() => setError(null)} />

        <form onSubmit={LoginValidation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              User Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
