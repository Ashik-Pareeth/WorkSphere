import { useState, useEffect } from 'react';
import {
  clockIn,
  clockOut,
  getAttendanceHistory,
} from '../../api/attendanceApi';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .att-overlay {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(8, 8, 12, 0.75);
    backdrop-filter: blur(10px);
    animation: att-fade-in 0.3s ease;
  }
  @keyframes att-fade-in { from { opacity:0 } to { opacity:1 } }

  .att-modal {
    position: relative;
    width: 480px; max-width: 95vw;
    background: #0F0F13;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 48px 44px 44px;
    text-align: center;
    box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
    animation: att-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }
  @keyframes att-slide-up {
    from { opacity:0; transform: translateY(32px) scale(0.96) }
    to   { opacity:1; transform: translateY(0) scale(1) }
  }
  .att-modal::before {
    content: ''; position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .att-clock-ring {
    width: 100px; height: 100px; border-radius: 50%;
    background: linear-gradient(135deg, #052e16, #064e3b);
    border: 2px solid rgba(52,211,153,0.3);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 28px;
    animation: att-pulse-ring 2.5s ease-in-out infinite;
  }
  @keyframes att-pulse-ring {
    0%,100% { box-shadow: 0 0 0 12px rgba(52,211,153,0.06), 0 0 0 24px rgba(52,211,153,0.03); }
    50%      { box-shadow: 0 0 0 16px rgba(52,211,153,0.10), 0 0 0 32px rgba(52,211,153,0.05); }
  }
  .att-time {
    font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800;
    color: #FAFAF8; letter-spacing: -1px; margin-bottom: 6px; line-height: 1;
  }
  .att-date {
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.35);
    font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 28px;
  }
  .att-modal-title {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700;
    color: #FAFAF8; margin-bottom: 8px;
  }
  .att-modal-sub {
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(255,255,255,0.4);
    line-height: 1.6; margin-bottom: 36px;
  }
  .att-clockin-btn {
    width: 100%; padding: 16px;
    background: linear-gradient(135deg, #059669, #047857);
    color: #ECFDF5; border: none; border-radius: 14px;
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.02em;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.2s; box-shadow: 0 4px 24px rgba(5,150,105,0.35);
    position: relative; overflow: hidden;
  }
  .att-clockin-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0; transition: opacity 0.2s;
  }
  .att-clockin-btn:hover::after { opacity: 1; }
  .att-clockin-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(5,150,105,0.45); }
  .att-clockin-btn:active { transform: translateY(0); }
  .att-clockin-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .att-skip-btn {
    background: none; border: none; font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: rgba(255,255,255,0.25); cursor: pointer;
    margin-top: 16px; padding: 8px; display: block; width: 100%; transition: color 0.2s;
  }
  .att-skip-btn:hover { color: rgba(255,255,255,0.45); }
  .att-error { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #f87171; margin-top: 12px; }

  .att-float {
    position: fixed; bottom: 32px; right: 32px; z-index: 1000;
    display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
    animation: att-float-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes att-float-in {
    from { opacity:0; transform: translateY(20px) scale(0.9) }
    to   { opacity:1; transform: translateY(0) scale(1) }
  }
  .att-float-badge {
    display: flex; align-items: center; gap: 8px;
    background: rgba(15,15,19,0.92); border: 1px solid rgba(52,211,153,0.2);
    border-radius: 20px; padding: 6px 14px 6px 10px;
    backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .att-float-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #34d399; flex-shrink: 0;
    animation: att-dot-pulse 2s ease-in-out infinite;
  }
  @keyframes att-dot-pulse {
    0%,100% { opacity:1; transform:scale(1) }
    50%      { opacity:0.6; transform:scale(0.85) }
  }
  .att-float-label {
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.7); letter-spacing: 0.03em;
  }
  .att-float-timer {
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #34d399;
  }
  .att-float-clockout {
    display: flex; align-items: center; gap: 10px;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: white; border: none; border-radius: 16px; padding: 14px 22px;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.02em;
    box-shadow: 0 4px 24px rgba(234,88,12,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .att-float-clockout::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  }
  .att-float-clockout:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 32px rgba(234,88,12,0.55); }
  .att-float-clockout:active { transform: translateY(0) scale(1); }
  .att-float-clockout:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

  .att-header-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 20px; padding: 6px 14px 6px 10px; margin-top: 12px;
  }
  .att-header-pill-text {
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #15803d;
  }
  .att-skeleton {
    height: 36px; width: 120px; background: #f1f5f9;
    border-radius: 8px; animation: att-shimmer 1.5s ease-in-out infinite; margin-top: 12px;
  }
  @keyframes att-shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

if (!document.getElementById('att-styles')) {
  const el = document.createElement('style');
  el.id = 'att-styles';
  el.textContent = STYLES;
  document.head.appendChild(el);
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Anchored to a real Date — survives refreshes
function useElapsed(clockInTime) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!clockInTime) {
      setElapsed('');
      return;
    }
    const tick = () => {
      const s = Math.floor((Date.now() - clockInTime.getTime()) / 1000);
      if (s < 0) {
        setElapsed('00:00:00');
        return;
      }
      const h = Math.floor(s / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((s % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInTime]);
  return elapsed;
}

const ClockIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const StopIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" />
  </svg>
);

const AttendanceTracker = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const now = useLiveClock();
  const elapsed = useElapsed(clockInTime);

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const history = await getAttendanceHistory();
        if (history && history.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayLog = history.find((log) => log.date === today);

          if (todayLog?.clockIn && !todayLog?.clockOut) {
            setIsClockedIn(true);
            setClockInTime(new Date(todayLog.clockIn)); // ← real backend timestamp
          } else {
            setShowPopup(true);
          }
        } else {
          setShowPopup(true);
        }
      } catch (err) {
        console.error('Failed to load attendance history', err);
        setShowPopup(true);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await clockIn();
      setIsClockedIn(true);
      setClockInTime(new Date()); // fresh session starts now
      setShowPopup(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await clockOut();
      setIsClockedIn(false);
      setClockInTime(null);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to clock out. Try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="att-skeleton" />;

  return (
    <>
      {/* CLOCK-IN POPUP */}
      {showPopup && !isClockedIn && (
        <div className="att-overlay">
          <div className="att-modal">
            <div className="att-clock-ring">
              <ClockIcon size={44} />
            </div>
            <div className="att-time">{timeStr}</div>
            <div className="att-date">{dateStr}</div>
            <div className="att-modal-title">Start your day</div>
            <div className="att-modal-sub">
              You haven't clocked in yet. Clock in to begin tracking your shift
              and log your hours for today.
            </div>
            <button
              className="att-clockin-btn"
              onClick={handleClockIn}
              disabled={actionLoading}
            >
              <ClockIcon size={20} />
              {actionLoading ? 'Clocking in…' : 'Clock In Now'}
            </button>
            {error && <div className="att-error">{error}</div>}
            <button
              className="att-skip-btn"
              onClick={() => setShowPopup(false)}
            >
              I'll do this later
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CLOCK-OUT */}
      {isClockedIn && (
        <div className="att-float">
          <div className="att-float-badge">
            <span className="att-float-dot" />
            <span className="att-float-label">On shift</span>
            {elapsed && <span className="att-float-timer">{elapsed}</span>}
          </div>
          <button
            className="att-float-clockout"
            onClick={handleClockOut}
            disabled={actionLoading}
          >
            <StopIcon />
            {actionLoading ? 'Clocking out…' : 'Clock Out'}
          </button>
          {error && (
            <div
              style={{
                fontFamily: 'DM Sans,sans-serif',
                fontSize: 12,
                color: '#f87171',
                textAlign: 'right',
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* INLINE HEADER INDICATOR */}
      {isClockedIn ? (
        <div className="att-header-pill">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              flexShrink: 0,
              animation: 'att-dot-pulse 2s ease-in-out infinite',
            }}
          />
          <span className="att-header-pill-text">
            On shift — clock out bottom right
          </span>
        </div>
      ) : (
        !showPopup && (
          <button
            onClick={() => setShowPopup(true)}
            style={{ marginTop: 12 }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            Clock In
          </button>
        )
      )}
    </>
  );
};

export default AttendanceTracker;
