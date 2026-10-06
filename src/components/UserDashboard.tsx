import React, { useState, useMemo } from 'react';
import { BsnlLogo } from './BsnlLogo';
import { MonthPicker } from './MonthPicker';
import { AllowanceBar } from './AllowanceBar';
import { EntriesTable } from './EntriesTable';
import { LogEntry, User } from '../types';
import { DEFAULT_VEHICLE_REGISTRATION, formatDate, formatMonthYear, sortEntriesChronologically } from '../constants';

interface UserDashboardProps {
  currentUser: User;
  entries: LogEntry[];
  onNewEntry: () => void;
  onEditEntry?: (entry: LogEntry) => void;
  onReport: (year?: number, month?: number) => void;
  onLogout: () => void;
  logoUrl?: string;
  onUpdatePassword: (userId: string, newPass: string) => void;
  vehicleRegistration?: string;
  closedMonths?: string[];
}

export function UserDashboard({
  currentUser,
  entries,
  onNewEntry,
  onEditEntry,
  onReport,
  onLogout,
  logoUrl = '',
  onUpdatePassword,
  vehicleRegistration = DEFAULT_VEHICLE_REGISTRATION,
  closedMonths = [],
}: UserDashboardProps) {
  const now = new Date();
  const initialDate = useMemo(() => {
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const hasCurrent = entries.some((e) => e.date?.startsWith(currentKey));
    if (hasCurrent) return { year: now.getFullYear(), month: now.getMonth() };
    const dates = entries
      .map((e) => e.date)
      .filter(Boolean)
      .sort()
      .reverse();
    if (dates.length > 0 && dates[0]) {
      const [y, m] = dates[0].split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [entries]);

  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [filterMyTripsOnly, setFilterMyTripsOnly] = useState(false);

  // Check if current user has an ongoing pending trip
  const pendingTrip = useMemo(() => {
    return entries.find(
      (e) =>
        (e.status === 'pending' || (!Number(e.actualCMR) && !e.placesVisited)) &&
        e.user === currentUser.username
    );
  }, [entries, currentUser]);

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const isClosed = closedMonths.includes(currentMonthKey);

  const monthlyEntries = useMemo(() => {
    const filtered = entries.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return sortEntriesChronologically(filtered);
  }, [entries, year, month]);

  // Current logged in officer's entries
  const myMonthlyEntries = useMemo(() => {
    return monthlyEntries.filter(
      (e) => e.user && e.user.toLowerCase() === currentUser.username.toLowerCase()
    );
  }, [monthlyEntries, currentUser]);

  const totalUsed = monthlyEntries.reduce((sum, e) => sum + (Number(e.actualCMR) > 0 ? e.km : 0), 0);
  const myTotalKm = myMonthlyEntries.reduce((sum, e) => sum + (Number(e.actualCMR) > 0 ? e.km : 0), 0);

  const displayedEntries = filterMyTripsOnly ? myMonthlyEntries : monthlyEntries;

  function handleNewEntryClick() {
    if (pendingTrip) {
      setShowPendingWarning(true);
      return;
    }
    onNewEntry();
  }

  function handleChangePassword() {
    const entered = currentPass.trim().toLowerCase();
    const existing = String(currentUser.password || 'Bsnl').trim().toLowerCase();
    if (entered !== existing) {
      setPassMsg('Current password is incorrect (case-insensitive).');
      return;
    }
    if (!newPass || newPass.trim().length < 4) {
      setPassMsg('New password must be at least 4 characters.');
      return;
    }
    if (newPass.trim() !== confirmPass.trim()) {
      setPassMsg('Passwords do not match.');
      return;
    }
    onUpdatePassword(currentUser.id, newPass.trim());
    setPassMsg('✓ Password changed successfully.');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => {
      setShowPassword(false);
      setPassMsg('');
    }, 1800);
  }

  return (
    <div className="min-h-screen bg-[#EEF2F9]">
      <header className="bg-white border-b border-[#D4DEF0] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BsnlLogo logoUrl={logoUrl} />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div
                className="text-[#003087] font-semibold text-xs"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {vehicleRegistration}
              </div>
              <div className="text-[#5A6A82] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                {currentUser.name}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => onReport(year, month)}
                className="text-[#003087] text-xs font-semibold px-2.5 py-1 rounded border border-[#C8D5EB] hover:border-[#003087] hover:bg-blue-50 transition-colors cursor-pointer"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Report
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#003087] bg-blue-50 text-xs px-2.5 py-1 rounded border border-[#C8D5EB] hover:border-[#003087] hover:bg-blue-100 transition-colors cursor-pointer font-medium flex items-center gap-1"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
                title="Change personal password"
              >
                <span>🔑</span>
                <span>{showPassword ? 'Hide' : 'Password'}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="text-[#5A6A82] text-xs px-2 py-1 rounded border border-[#C8D5EB] hover:border-[#003087] hover:text-[#003087] transition-colors cursor-pointer"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        <div className="sm:hidden text-center">
          <div
            className="text-[#003087] font-semibold text-sm"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {vehicleRegistration}
          </div>
          <div className="text-[#5A6A82] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
            {currentUser.name}
          </div>
        </div>

        {showPassword && (
          <div className="bg-white border border-[#D4DEF0] rounded p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h3
                className="font-semibold text-sm text-[#003087]"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Change Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPassword(false);
                  setCurrentPass('');
                  setNewPass('');
                  setConfirmPass('');
                  setPassMsg('');
                }}
                className="text-[#8A99AE] text-xs hover:text-[#003087] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <input
              type="password"
              className="w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
              placeholder="Current password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <input
              type="password"
              className="w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
              placeholder="New password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <input
              type="password"
              className="w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#003087]"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            {passMsg && (
              <p
                className="text-xs font-medium"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: passMsg.startsWith('✓') ? '#15803d' : '#dc2626',
                }}
              >
                {passMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleChangePassword}
              className="bg-[#003087] text-white text-xs font-semibold px-4 py-2 rounded hover:bg-[#00236A] transition-colors cursor-pointer"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              Change Password
            </button>
          </div>
        )}

        {/* Pending Trip Banner */}
        {pendingTrip && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-xl font-bold">
                  ⏳
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded"
                      style={{ fontFamily: "'Work Sans', sans-serif" }}
                    >
                      Ongoing Trip in Progress (Pending)
                    </span>
                    <span className="text-xs text-amber-700 font-medium">
                      {formatDate(pendingTrip.date)} at {pendingTrip.startTime}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1A2A4A] mt-1">
                    Started from <span className="text-[#003087] font-bold">{pendingTrip.startStation}</span> with OMR{' '}
                    <span className="font-mono text-[#003087] font-bold">{pendingTrip.actualOMR} KM</span> (Logbook OMR: {pendingTrip.logbookOMR} KM)
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    When this journey concludes, complete and close this trip with the final CMR and visited destinations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditEntry?.(pendingTrip)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Complete Trip →
              </button>
            </div>
          </div>
        )}

        {/* Pending Trip Warning Modal */}
        {showPendingWarning && pendingTrip && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-amber-300 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-xl font-bold">
                  ⚠
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A2A4A]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Pending Trip Detected!
                  </h3>
                  <p className="text-xs text-red-600 font-semibold mt-0.5">
                    An ongoing trip is currently pending completion.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-[#1A2A4A] space-y-1.5">
                <div>
                  <span className="text-[#5A6A82]">Started on: </span>
                  <strong>{formatDate(pendingTrip.date)} at {pendingTrip.startTime}</strong>
                </div>
                <div>
                  <span className="text-[#5A6A82]">From Station: </span>
                  <strong>{pendingTrip.startStation}</strong>
                </div>
                <div>
                  <span className="text-[#5A6A82]">Opening OMR: </span>
                  <strong className="font-mono text-[#003087]">{pendingTrip.actualOMR} KM</strong>
                </div>
                <p className="text-amber-900 font-medium pt-1.5 border-t border-amber-200/60 mt-1">
                  Please complete and close the existing pending trip before creating a new log entry.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowPendingWarning(false)}
                  className="px-3 py-2 text-xs border border-[#C8D5EB] text-[#5A6A82] rounded hover:bg-gray-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPendingWarning(false);
                    onEditEntry?.(pendingTrip);
                  }}
                  className="px-4 py-2 text-xs bg-[#003087] hover:bg-[#00236A] text-white rounded font-bold transition-colors cursor-pointer"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  Complete Pending Trip →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Officer Personal Summary Card */}
        <div className="bg-white border border-[#D4DEF0] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#EEF2F9] pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#E8F1FC] text-[#003087] flex items-center justify-center font-bold text-xs shrink-0">
                👤
              </span>
              <div>
                <div className="text-xs font-bold text-[#003087]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Officer: {currentUser.name}
                </div>
                <div className="text-[11px] text-[#5A6A82]">
                  {currentUser.designation || 'BSNL Telecom Officer'} · @{currentUser.username}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onReport(year, month)}
              className="text-xs font-bold text-[#003087] bg-[#E8F1FC] hover:bg-[#D4E5FA] px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              <span>📄 View Monthly Statement</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded p-2.5">
              <div className="text-[10px] font-bold text-[#5A6A82] uppercase tracking-wider">
                My Trips Run
              </div>
              <div className="text-lg font-black text-[#003087] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {myMonthlyEntries.length} {myMonthlyEntries.length === 1 ? 'trip' : 'trips'}
              </div>
            </div>

            <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded p-2.5">
              <div className="text-[10px] font-bold text-[#5A6A82] uppercase tracking-wider">
                My Distance Run
              </div>
              <div className="text-lg font-black text-[#003087] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {myTotalKm.toLocaleString()} KM
              </div>
            </div>

            <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded p-2.5">
              <div className="text-[10px] font-bold text-[#5A6A82] uppercase tracking-wider">
                Vehicle Total Used
              </div>
              <div className="text-lg font-black text-[#1A2A4A] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {totalUsed.toLocaleString()} KM
              </div>
            </div>

            <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded p-2.5">
              <div className="text-[10px] font-bold text-[#5A6A82] uppercase tracking-wider">
                Vehicle Remaining
              </div>
              <div className="text-lg font-black text-green-700 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {Math.max(2000 - totalUsed, 0).toLocaleString()} KM
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#D4DEF0] rounded p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2
                className="text-[#003087] font-bold text-sm uppercase tracking-wider"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Monthly KM Status
              </h2>
              {isClosed ? (
                <span
                  className="bg-red-50 text-red-600 border border-red-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  🔒 Closed by Admin
                </span>
              ) : (
                <span
                  className="bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  ● Active
                </span>
              )}
            </div>
            <MonthPicker
              year={year}
              month={month}
              onChange={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
            />
          </div>
          <AllowanceBar used={totalUsed} />
        </div>

        {isClosed ? (
          <div
            className="w-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] font-medium py-3 px-4 rounded text-xs flex items-center justify-between flex-wrap gap-2"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            <span className="flex items-center gap-1.5 font-semibold text-red-700">
              🔒 Month is closed by Admin. No new entries can be added.
            </span>
            <button
              type="button"
              onClick={() => onReport(year, month)}
              className="text-[#003087] font-bold hover:underline cursor-pointer"
            >
              Download PDF / CSV in Report →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNewEntryClick}
            className="w-full bg-[#003087] hover:bg-[#00236A] text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            <span className="text-lg font-light">+</span> New Log Entry
          </button>
        )}

        <div className="bg-white border border-[#D4DEF0] rounded-lg overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-[#EEF2F9] flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2
                className="text-[#003087] font-bold text-sm uppercase tracking-wider"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Monthly Logbook — {formatMonthYear(year, month)}
              </h2>
              <span className="text-[#8A99AE] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                Showing {displayedEntries.length} of {monthlyEntries.length} trips
              </span>
            </div>

            {/* Filter Toggle: All Trips vs My Trips Only */}
            <div className="flex items-center bg-[#EEF2F9] p-1 rounded-md border border-[#D4DEF0] text-xs">
              <button
                type="button"
                onClick={() => setFilterMyTripsOnly(false)}
                className={`px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
                  !filterMyTripsOnly
                    ? 'bg-[#003087] text-white shadow-xs'
                    : 'text-[#5A6A82] hover:text-[#003087]'
                }`}
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                All Trips ({monthlyEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMyTripsOnly(true)}
                className={`px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
                  filterMyTripsOnly
                    ? 'bg-[#003087] text-white shadow-xs'
                    : 'text-[#5A6A82] hover:text-[#003087]'
                }`}
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                My Trips Only ({myMonthlyEntries.length})
              </button>
            </div>
          </div>
          <EntriesTable
            entries={displayedEntries}
            onEdit={onEditEntry}
            isAdmin={false}
            closedMonths={closedMonths}
            isMonthClosed={isClosed}
          />
        </div>
      </div>
    </div>
  );
}
