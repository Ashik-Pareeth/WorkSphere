import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../hooks/useAuth';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

const ROLE_PRIORITY = {
  SUPER_ADMIN: 5,
  HR: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  AUDITOR: 1,
};

const getHighestRole = (roles = []) => {
  return roles.reduce((highest, current) => {
    if (!highest) return current;

    return ROLE_PRIORITY[current] > ROLE_PRIORITY[highest] ? current : highest;
  }, null);
};

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function LoginValidation(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    localStorage.clear();

    try {
      const response = await axiosInstance.post('/login', {
        userName,
        password,
      });

      const token = response.data.token;
      const decoded = jwtDecode(token);

      let roles = [];

      if (decoded.roles) {
        roles = decoded.roles;
      } else if (decoded.authorities) {
        roles = decoded.authorities;
      } else if (decoded.role) {
        roles = [decoded.role];
      }

      login({
        token: token,
        employeeId: response.data.employeeId,
        roles: roles,
        status: response.data.employeeStatus,
      });

      const highestRole = getHighestRole(roles);

      if (highestRole) {
        localStorage.setItem('role', highestRole);
      }

      if (response.data.employeeStatus === 'PENDING') {
        navigate('/onBoarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed', err);
      setError(err);
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1c] font-dm text-slate-200 overflow-hidden selection:bg-blue-500/30">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-162.5 h-130 bg-blue-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[65%] w-[320px] h-80 bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[60%] left-[25%] w-65 h-65 bg-cyan-500/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Noise Texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay noise" />

      {/* FIX 4 — Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Login Card */}
      <div className="relative w-full max-w-107.5 bg-slate-900/70 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_40px_90px_-25px_rgba(0,0,0,1)] p-10 sm:p-12 animate-[fadeIn_0.6s_ease-out]">
        {/* FIX 3 — Card Top Highlight */}
        <div className="absolute inset-x-0 top-0 h-px mx-10 bg-linear-to-r from-transparent via-blue-400/30 to-transparent rounded-full" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center 
            bg-linear-to-br from-blue-500/20 to-indigo-500/5 
            border border-blue-500/20 
            shadow-[0_0_40px_rgba(59,130,246,0.18)] mb-6"
          >
            <KeyRound className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-white mb-2 font-sora">
            Welcome back
          </h1>

          <p className="text-slate-400 text-sm">
            Sign in to access your WorkSphere dashboard
          </p>
        </div>

        <AlertMessage error={error} onClose={() => setError(null)} />

        <form onSubmit={LoginValidation} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-slate-300 ml-1"
            >
              Username
            </Label>

            <Input
              id="username"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="Enter your username"
              className="
              h-12
              bg-black/40
              border border-slate-800
              text-slate-100
              placeholder:text-slate-500
              rounded-xl
              px-4
              transition-all
              hover:border-slate-700
              focus-visible:ring-2
              focus-visible:ring-blue-500/80
              focus-visible:border-blue-500
              shadow-inner
              "
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1 pr-1">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-300"
              >
                Password
              </Label>

              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="
                h-12
                bg-black/40
                border border-slate-800
                text-slate-100
                placeholder:text-slate-500
                rounded-xl
                px-4 pr-12
                transition-all
                hover:border-slate-700
                focus-visible:ring-2
                focus-visible:ring-blue-500/80
                focus-visible:border-blue-500
                shadow-inner
                "
              />

              {/* Toggle Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-2 rounded-md
                text-slate-500
                hover:text-slate-300
                hover:bg-white/5
                transition
                "
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="
    w-full h-12
    bg-blue-600
    hover:bg-blue-500
    text-white
    font-semibold
    text-[15px]
    rounded-xl
    transition-all
    active:scale-[0.97]
    shadow-[0_0_20px_rgba(37,99,235,0.35)]
    hover:shadow-[0_0_30px_rgba(37,99,235,0.45)]
    hover:-translate-y-px
    border border-blue-500/40
    flex items-center justify-center gap-2
    disabled:opacity-70 disabled:cursor-not-allowed
    "
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        {/* FIX 1 — Footer moved inside card */}
        <p className="text-center text-[12.5px] text-slate-600 mt-8">
          Don't have an account?{' '}
          <button className="text-slate-400 hover:text-slate-200 transition-colors font-medium">
            Contact your administrator
          </button>
        </p>
      </div>
    </div>
  );
}
