import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // If no token in URL, kick them back to forgot-password
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side match validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/reset-password', { 
        token, 
        newPassword 
      });
      setSuccess(response.data);
      // Wait briefly then redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password failed', err);
      setError(
        err.response?.data?.message ||
          'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null; // Avoid flashing the form before redirect

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1c] font-dm text-slate-200 overflow-hidden selection:bg-blue-500/30">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-162.5 h-130 bg-blue-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[65%] w-[320px] h-80 bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[60%] left-[25%] w-[260px] h-[260px] bg-cyan-500/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Noise Texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay noise" />

      {/* Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Reset Password Card */}
      <div className="relative w-full max-w-107.5 bg-slate-900/70 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_40px_90px_-25px_rgba(0,0,0,1)] p-10 sm:p-12 animate-[fadeIn_0.6s_ease-out]">
        <div className="absolute inset-x-0 top-0 h-px mx-10 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rounded-full" />

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
            Create New Password
          </h1>

          <p className="text-slate-400 text-sm">
            Enter your new secure password below.
          </p>
        </div>

        <AlertMessage error={error} success={success} onClose={() => setError(null)} />

        {success ? (
          <div className="text-center">
            <p className="text-slate-400 mb-6">Redirecting to login...</p>
            <div className="text-center mt-6">
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Click here if not redirected</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-sm font-medium text-slate-300 ml-1"
              >
                New Password
              </Label>

              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-300 ml-1"
              >
                Confirm Password
              </Label>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              </div>
            </div>

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
                "
              >
                {loading ? 'Processing...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
