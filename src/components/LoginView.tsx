import React, { useState, useMemo } from 'react';
import { BsnlLogo } from './BsnlLogo';
import { LogEntry, User } from '../types';
import { DEFAULT_LOGO_URL, DEFAULT_MONTHLY_ALLOWANCE, DEFAULT_VEHICLE_IMG, DEFAULT_VEHICLE_REGISTRATION } from '../constants';
import { Calendar, Gauge } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User | null) => void;
  logoUrl?: string;
  vehicleImg?: string;
  vehicleRegistration?: string;
  users: User[];
  entries?: LogEntry[];
  monthlyAllowance?: number;
  adminPassword?: string;
  onApiLogin?: (credentials: { username?: string; password: string; type: 'admin' | 'user' }) => Promise<any>;
}

export function LoginView({
  onLogin,
  logoUrl = DEFAULT_LOGO_URL,
  vehicleImg = DEFAULT_VEHICLE_IMG,
  vehicleRegistration = DEFAULT_VEHICLE_REGISTRATION,
  users,
  entries = [],
  monthlyAllowance = DEFAULT_MONTHLY_ALLOWANCE,
  adminPassword = 'Bsnlatt',
  onApiLogin,
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Current Month & Today's Date calculation
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthName = useMemo(() => {
    return now.toLocaleDateString('en-IN', { month: 'long' });
  }, [now]);
  const formattedCurrentDate = useMemo(() => {
    return now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [now]);

  // Current month entries from database
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthEntries = useMemo(() => {
    return (entries || []).filter((e) => {
      if (!e.date) return false;
      if (e.date.startsWith(currentMonthPrefix)) return true;
      try {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      } catch {
        return false;
      }
    });
  }, [entries, currentMonthPrefix, currentYear, currentMonth]);

  // Monthly KM calculations based on database
  const totalUsedThisMonth = useMemo(() => {
    return currentMonthEntries.reduce((sum, e) => sum + (Number(e.km) || 0), 0);
  }, [currentMonthEntries]);

  const allowance = Number(monthlyAllowance) || DEFAULT_MONTHLY_ALLOWANCE;
  const remainingKm = Math.max(allowance - totalUsedThisMonth, 0);
  const usedPercentage = Math.min((totalUsedThisMonth / allowance) * 100, 100);
  const isApproaching = totalUsedThisMonth >= allowance * 0.85 && totalUsedThisMonth <= allowance;
  const isExceeded = totalUsedThisMonth > allowance;

  async function handleLogin() {
    setError('');
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanPassword) {
      setError(isAdmin ? 'Please enter the admin password.' : 'Please enter your password.');
      return;
    }
    if (!isAdmin && !cleanUsername) {
      setError('Please select an officer or enter your username.');
      return;
    }

    setLoading(true);

    // 1. Direct local credential verification (guarantees instantaneous, 100% reliable login)
    if (isAdmin) {
      const targetAdminPass = String(adminPassword || 'Bsnlatt').trim().toLowerCase();
      if (cleanPassword.toLowerCase() === targetAdminPass) {
        onLogin(null);
        setLoading(false);
        // Background sync with API
        onApiLogin?.({ username: 'admin', password: cleanPassword, type: 'admin' }).catch(() => {});
        return;
      }
    } else {
      const match = users.find((u) => {
        const uName = (u.username || '').toLowerCase();
        const uNormalized = uName.replace(/[._\s-]+/g, '');
        const inputNormalized = cleanUsername.toLowerCase().replace(/[._\s-]+/g, '');
        const isUserMatch =
          uName === cleanUsername.toLowerCase() ||
          uNormalized === inputNormalized ||
          u.id === cleanUsername ||
          u.name.toLowerCase().includes(cleanUsername.toLowerCase());
        const userPass = String(u.password || 'Bsnl').trim().toLowerCase();
        const passMatch = userPass === cleanPassword.toLowerCase();
        return isUserMatch && passMatch && u.active;
      });

      if (match) {
        onLogin(match);
        setLoading(false);
        // Background sync with API
        onApiLogin?.({ username: match.username, password: cleanPassword, type: 'user' }).catch(() => {});
        return;
      }
    }

    // 2. If local check didn't match, verify with server API
    if (onApiLogin) {
      try {
        const res = await onApiLogin({
          username: isAdmin ? 'admin' : cleanUsername,
          password: cleanPassword,
          type: isAdmin ? 'admin' : 'user',
        });
        if (res && res.success) {
          if (res.isAdmin) {
            onLogin(null);
          } else {
            onLogin(res.user);
          }
          setLoading(false);
          return;
        } else if (res && res.message && !res.message.toLowerCase().includes('fetch') && !res.message.toLowerCase().includes('connect')) {
          setError(res.message);
          setLoading(false);
          return;
        }
      } catch (e: any) {
        // Silently fall through
      }
    }

    // 3. If neither matched, display friendly invalid credentials message
    setError(
      isAdmin
        ? 'Invalid admin password. Default password is Bsnlatt (case-insensitive).'
        : 'Invalid officer username or password. Default officer password is Bsnl (case-insensitive).'
    );
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#EEF2F9] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <BsnlLogo logoUrl={logoUrl} />
          </div>
          <h1
            className="text-[#003087] font-bold text-xl tracking-tight mb-0.5"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            Vehicle Digital Logbook
          </h1>
          <p className="text-[#5A6A82] text-xs font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
            Official Internal Application · Attingal Division
          </p>
        </div>

        {/* Vehicle Header Card */}
        <div className="bg-white border border-[#D4DEF0] rounded overflow-hidden mb-3 shadow-xs">
          <div className="h-28 bg-[#1A2A4A] flex items-center justify-center overflow-hidden">
            {vehicleImg && !vehicleImg.includes('unsplash.com') ? (
              <img
                src={vehicleImg}
                alt="Vehicle"
                className="w-full h-full object-cover opacity-90"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_VEHICLE_IMG;
                }}
              />
            ) : (
              <img
                src={DEFAULT_VEHICLE_IMG}
                alt="Vehicle"
                className="w-full h-full object-cover opacity-90"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="py-2 text-center bg-[#F8FAFD] border-t border-[#E8EEF8]">
            <span
              className="text-[#003087] font-bold text-sm tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {vehicleRegistration}
            </span>
          </div>
        </div>

        {/* Current Month & Remaining KM Status Widget */}
        <div className="bg-white border border-[#CCD8EC] rounded-lg p-4 mb-3 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8EEF8]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#E8F1FC] text-[#003087] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div
                  className="text-[10px] font-bold text-[#5A6A82] uppercase tracking-wider"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  Current Month
                </div>
                <div
                  className="text-base font-extrabold text-[#003087] leading-tight"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  {currentMonthName} {currentYear}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className="text-[10px] font-bold text-[#5A6A82] uppercase tracking-wider"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Today's Date
              </div>
              <div
                className="text-xs font-semibold text-[#1A2A4A]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formattedCurrentDate}
              </div>
            </div>
          </div>

          {/* Remaining Kilometers for this Month */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <div
                className="text-xs font-bold text-[#1A2A4A] flex items-center gap-1.5"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                <Gauge className="w-4 h-4 text-[#003087]" />
                Remaining Kilometers for this Month
              </div>
              <span
                className={`text-base font-extrabold ${
                  isExceeded ? 'text-red-600' : isApproaching ? 'text-amber-600' : 'text-green-700'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {remainingKm.toLocaleString()} KM
              </span>
            </div>

            {/* Allowance Progress Bar */}
            <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden my-2">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isExceeded ? 'bg-red-500' : isApproaching ? 'bg-amber-500' : 'bg-[#003087]'
                }`}
                style={{ width: `${usedPercentage}%` }}
              />
            </div>

            <div
              className="flex justify-between items-center text-xs text-[#5A6A82]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span>
                <strong className="text-[#1A2A4A]">{totalUsedThisMonth.toLocaleString()} KM</strong> used
                {currentMonthEntries.length > 0 ? ` (${currentMonthEntries.length} ${currentMonthEntries.length === 1 ? 'trip' : 'trips'})` : ' (0 trips)'}
              </span>
              <span>
                Monthly Allowance: <strong className="text-[#1A2A4A]">{allowance.toLocaleString()} KM</strong>
              </span>
            </div>

            {isExceeded && (
              <div
                className="mt-2 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded px-2.5 py-1 text-center"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                ⚠ Monthly allowance exceeded by {(totalUsedThisMonth - allowance).toLocaleString()} KM
              </div>
            )}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-[#D4DEF0] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-[#1A2A4A] font-semibold text-base"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              {isAdmin ? 'Admin Login' : 'User Login'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsAdmin(!isAdmin);
                setError('');
                setUsername('');
                setPassword('');
              }}
              className="text-[#0055C8] text-xs font-medium hover:underline cursor-pointer"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isAdmin ? '← User Login' : 'Admin Login'}
            </button>
          </div>

          <div className="space-y-3">
            {!isAdmin ? (
              <div>
                <label
                  className="block text-[#5A6A82] text-xs font-medium mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  Officer Account
                </label>
                <select
                  className="w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm text-[#1A2A4A] bg-white focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087] mb-2 cursor-pointer"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={users.some((u) => u.username.toLowerCase() === username.toLowerCase()) ? username : ''}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                >
                  <option value="">-- Select Officer Account --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.name} ({u.username})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 text-[11px] text-[#5A6A82] mb-1">
                  <span>Or enter username directly:</span>
                </div>
                <input
                  className="w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm text-[#1A2A4A] focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="e.g. jto_attingal, jto_varkala, sde_kilimanoor, agm_attingal"
                  autoComplete="username"
                />
              </div>
            ) : (
              <div>
                <label
                  className="block text-[#5A6A82] text-xs font-medium mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  Administrator Account
                </label>
                <div className="bg-[#F5F8FD] border border-[#C8D5EB] rounded px-3 py-2 text-xs font-semibold text-[#003087] flex items-center justify-between">
                  <span>admin (System Administrator)</span>
                  <span className="bg-blue-100 text-[#003087] text-[10px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className="block text-[#5A6A82] text-xs font-medium uppercase tracking-wider"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  {isAdmin ? 'Admin Password' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#0055C8] hover:underline cursor-pointer"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm text-[#1A2A4A] focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]"
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={isAdmin ? 'Enter admin password (default: Bsnlatt)' : 'Enter password (default: Bsnl)'}
                autoComplete="current-password"
              />
              <p className="text-[11px] text-[#5A6A82] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                {isAdmin
                  ? 'Default Admin password is Bsnlatt (case-insensitive)'
                  : 'Default password for all officers is Bsnl (case-insensitive)'}
              </p>
            </div>

            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded font-medium"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#003087] hover:bg-[#00236A] text-white font-semibold py-2.5 rounded text-sm transition-colors cursor-pointer disabled:opacity-60"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>

        <p
          className="text-center text-[#8A99AE] text-xs mt-4"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Attingal Network Division, Trivandrum Business Area · Confidential Internal System
        </p>
      </div>
    </div>
  );
}
