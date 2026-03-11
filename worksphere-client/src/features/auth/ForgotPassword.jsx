import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.post('/forgot-password', { email });
      setSuccess(response.data);
      setEmail('');
    } catch (err) {
      console.error('Forgot password failed', err);
      // Fallback in case of server failure (enumeration prevention should avoid 4xx on pure logic)
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Forgot Password Card */}
      <div className="relative w-full max-w-107.5 bg-slate-900/70 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_40px_90px_-25px_rgba(0,0,0,1)] p-10 sm:p-12 animate-[fadeIn_0.6s_ease-out]">
        <div className="absolute inset-x-0 top-0 h-px mx-10 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rounded-full" />

        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

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
            Reset Password
          </h1>

          <p className="text-slate-400 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <AlertMessage error={error} success={success} onClose={() => { setError(null); setSuccess(null); }} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-slate-300 ml-1"
            >
              Email Address
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your registered email"
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
