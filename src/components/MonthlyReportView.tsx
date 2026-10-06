import React, { useState, useMemo } from 'react';
import { BsnlLogo } from './BsnlLogo';
import { MonthPicker } from './MonthPicker';
import { LogEntry, User } from '../types';
import {
  DEFAULT_MONTHLY_ALLOWANCE,
  DEFAULT_VEHICLE_REGISTRATION,
  formatDate,
  formatMonthYear,
  sortEntriesChronologically,
} from '../constants';

interface MonthlyReportViewProps {
  entries: LogEntry[];
  currentUser: User;
  logoUrl?: string;
  onBack: () => void;
  vehicleRegistration?: string;
  monthlyAllowance?: number;
  closedMonths?: string[];
  isAdmin?: boolean;
  onToggleMonthClose?: (monthKey: string) => void;
  initialYear?: number;
  initialMonth?: number;
}

export function MonthlyReportView({
  entries,
  currentUser,
  logoUrl = '',
  onBack,
  vehicleRegistration = DEFAULT_VEHICLE_REGISTRATION,
  monthlyAllowance = DEFAULT_MONTHLY_ALLOWANCE,
  closedMonths = [],
  isAdmin = false,
  onToggleMonthClose,
  initialYear,
  initialMonth,
}: MonthlyReportViewProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(
    initialYear !== undefined ? initialYear : now.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth !== undefined ? initialMonth : now.getMonth()
  );

  // Officer filter: 'all' or officer username
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all');

  // Mobile layout mode: 'auto' | 'table' | 'cards'
  const [mobileViewMode, setMobileViewMode] = useState<'table' | 'cards'>('cards');

  const selectedMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const isClosed = closedMonths.includes(selectedMonthKey);

  // Month date range
  const fromDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  const lastDayNum = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const toDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

  // Filter entries for the selected month
  const allMonthEntries = useMemo(() => {
    const filtered = entries.filter((e) => {
      return e.date >= fromDate && e.date <= toDate;
    });
    return sortEntriesChronologically(filtered);
  }, [entries, fromDate, toDate]);

  // Distinct officers who ran trips this month
  const availableOfficers = useMemo(() => {
    const set = new Set<string>();
    allMonthEntries.forEach((e) => {
      if (e.user) set.add(e.user);
    });
    if (currentUser?.username) set.add(currentUser.username);
    return Array.from(set);
  }, [allMonthEntries, currentUser]);

  // Filtered by selected officer
  const reportEntries = useMemo(() => {
    if (selectedOfficer === 'all') return allMonthEntries;
    return allMonthEntries.filter(
      (e) => e.user && e.user.toLowerCase() === selectedOfficer.toLowerCase()
    );
  }, [allMonthEntries, selectedOfficer]);

  // Total KM calculations
  const totalVehicleUsed = useMemo(() => {
    return allMonthEntries.reduce(
      (sum, e) => sum + (Number(e.actualCMR) > 0 ? e.km : 0),
      0
    );
  }, [allMonthEntries]);

  const reportUsedKm = useMemo(() => {
    return reportEntries.reduce(
      (sum, e) => sum + (Number(e.actualCMR) > 0 ? e.km : 0),
      0
    );
  }, [reportEntries]);

  const vehicleRemainingKm = Math.max(monthlyAllowance - totalVehicleUsed, 0);

  function handleDownloadCSV() {
    if (!isClosed) return;

    const headers = [
      'Sl No',
      'Date',
      'Starting Time',
      'Starting Station',
      'Actual OMR (KM)',
      'Logbook OMR (KM)',
      'Places Visited',
      'Purpose of Journey',
      'Ending Station',
      'Actual CMR (KM)',
      'Logbook CMR (KM)',
      'Distance (KM)',
      'Officer / User',
      'Remarks',
    ];

    const rows = reportEntries.map((e, idx) => [
      idx + 1,
      `"${e.date}"`,
      `"${e.startTime}"`,
      `"${e.startStation}"`,
      e.actualOMR,
      e.logbookOMR,
      `"${(e.placesVisited || '').replace(/"/g, '""')}"`,
      `"${(e.purpose || '').replace(/"/g, '""')}"`,
      `"${e.endStation}"`,
      e.actualCMR,
      e.logbookCMR,
      e.km,
      `"${e.user}"`,
      `"${(e.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `BSNL_Logbook_Statement_${vehicleRegistration.replace(/\s+/g, '_')}_${selectedMonthKey}_${selectedOfficer}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const thClass =
    'border border-[#C8D5EB] bg-[#F5F8FD] px-2.5 py-2 text-xs font-semibold text-[#003087] text-left uppercase tracking-wider';
  const tdClass = 'border border-[#C8D5EB] px-2.5 py-2 text-xs text-[#1A2A4A] align-top';

  return (
    <div className="min-h-screen bg-[#EEF2F9] pb-12">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-[#D4DEF0] px-4 py-3 flex items-center justify-between no-print flex-wrap gap-2 sticky top-0 z-10 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-[#003087] text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          style={{ fontFamily: "'Work Sans', sans-serif" }}
        >
          ← Back to Logbook
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Close / Reopen button */}
          {isAdmin && onToggleMonthClose && (
            <div>
              {isClosed ? (
                <button
                  type="button"
                  onClick={() => onToggleMonthClose(selectedMonthKey)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded transition-colors cursor-pointer"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  🔓 Reopen Month Entries
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleMonthClose(selectedMonthKey)}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-3 py-2 rounded transition-colors cursor-pointer"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  🔒 Close Month Entries
                </button>
              )}
            </div>
          )}

          {/* Download CSV button - Enabled ONLY if month is closed */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={!isClosed}
            className={`font-semibold px-3 py-2 rounded text-xs transition-colors flex items-center gap-1.5 ${
              isClosed
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
            }`}
            style={{ fontFamily: "'Work Sans', sans-serif" }}
            title={!isClosed ? 'Download enabled after month is closed by Admin' : 'Download CSV'}
          >
            {isClosed ? '⬇ Download CSV' : '🔒 CSV Locked (Open Month)'}
          </button>

          {/* Print / Download PDF button - Enabled ONLY if month is closed */}
          <button
            type="button"
            onClick={() => {
              if (isClosed) window.print();
            }}
            disabled={!isClosed}
            className={`font-semibold px-3 py-2 rounded text-xs transition-colors flex items-center gap-1.5 ${
              isClosed
                ? 'bg-[#003087] hover:bg-[#00236A] text-white cursor-pointer shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
            }`}
            style={{ fontFamily: "'Work Sans', sans-serif" }}
            title={!isClosed ? 'Download enabled after month is closed by Admin' : 'Print or Save as PDF'}
          >
            {isClosed ? '🖨 Print / PDF' : '🔒 PDF Locked (Open Month)'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 no-print space-y-3">
        {/* Month & Officer Filter Toolbar */}
        <div className="bg-white border border-[#D4DEF0] rounded-lg p-3.5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold text-[#003087] uppercase tracking-wider"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Month:
              </span>
              <MonthPicker
                year={selectedYear}
                month={selectedMonth}
                onChange={(y, m) => {
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }}
              />
            </div>

            {/* Officer Filter */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold text-[#003087] uppercase tracking-wider"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Officer:
              </span>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="border border-[#C8D5EB] rounded px-2.5 py-1 text-xs text-[#1A2A4A] bg-white focus:outline-none focus:border-[#003087]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <option value="all">All Officers (Complete Statement)</option>
                {currentUser?.username && (
                  <option value={currentUser.username}>
                    My Trips Only ({currentUser.name})
                  </option>
                )}
                {availableOfficers
                  .filter((u) => u !== currentUser?.username)
                  .map((u) => (
                    <option key={u} value={u}>
                      Officer: @{u}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex items-center gap-1.5 md:hidden">
            <span className="text-[11px] font-medium text-[#5A6A82]">Mobile View:</span>
            <div className="flex border border-[#CBD5E1] rounded overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setMobileViewMode('cards')}
                className={`px-2 py-1 font-semibold ${
                  mobileViewMode === 'cards'
                    ? 'bg-[#003087] text-white'
                    : 'bg-white text-[#5A6A82]'
                }`}
              >
                📱 Cards
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`px-2 py-1 font-semibold ${
                  mobileViewMode === 'table'
                    ? 'bg-[#003087] text-white'
                    : 'bg-white text-[#5A6A82]'
                }`}
              >
                📊 Table
              </button>
            </div>
          </div>
        </div>

        {/* Status Notice: Open Month vs Closed Month */}
        {!isClosed ? (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 shadow-xs flex items-start gap-2.5">
            <span className="text-base">⏳</span>
            <div>
              <div className="font-bold text-amber-800">
                PROVISIONAL PENDING REPORT (MONTH OPEN)
              </div>
              <p className="mt-0.5 text-amber-800">
                This statement displays all trips logged up to the current date for review. Official PDF and CSV statement downloads will be unlocked once this month is closed and finalized by the Administrator.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-900 shadow-xs flex items-start gap-2.5">
            <span className="text-base">🔒</span>
            <div>
              <div className="font-bold text-emerald-800">
                OFFICIAL CERTIFIED STATEMENT (CLOSED MONTH)
              </div>
              <p className="mt-0.5 text-emerald-800">
                This statement has been closed and certified by the Administrator. Official PDF and CSV downloads are enabled.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Statement Document */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white border border-[#D4DEF0] rounded-lg p-4 sm:p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
          {/* Official Document Header */}
          <div className="border-b-2 border-[#003087] pb-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <BsnlLogo logoUrl={logoUrl} />
              <div className="text-right">
                <div
                  className="text-[#003087] font-bold text-xs uppercase tracking-widest"
                  style={{ fontFamily: "'Work Sans', sans-serif" }}
                >
                  BSNL · Kerala Telecom Circle
                </div>
                <div className="text-[#5A6A82] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Attingal Network Division, Trivandrum Business Area
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <h1
                className="text-[#003087] font-bold text-base sm:text-lg uppercase tracking-wider"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Monthly Vehicle Logbook Statement
              </h1>
              <div className="text-xs text-[#5A6A82] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                Statement for {formatMonthYear(selectedYear, selectedMonth)} ·{' '}
                {isClosed ? (
                  <strong className="text-emerald-700 font-bold">[CLOSED & CERTIFIED BY ADMIN]</strong>
                ) : (
                  <strong className="text-amber-700 font-bold">[PROVISIONAL PENDING STATEMENT]</strong>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle and Officer Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F8FD] border border-[#C8D5EB] rounded-lg p-3 mb-5 text-xs">
            <div>
              <div className="text-[#5A6A82] font-bold uppercase tracking-wider">
                Vehicle No.
              </div>
              <div className="font-bold text-[#003087] text-sm font-mono mt-0.5">
                {vehicleRegistration}
              </div>
            </div>
            <div>
              <div className="text-[#5A6A82] font-bold uppercase tracking-wider">
                Statement Scope
              </div>
              <div className="font-semibold text-[#1A2A4A] mt-0.5">
                {selectedOfficer === 'all'
                  ? 'All Officers (Vehicle Total)'
                  : `Officer @${selectedOfficer}`}
              </div>
            </div>
            <div>
              <div className="text-[#5A6A82] font-bold uppercase tracking-wider">
                Trips Run
              </div>
              <div className="font-semibold text-[#1A2A4A] mt-0.5">
                {reportEntries.length} {reportEntries.length === 1 ? 'trip' : 'trips'}
              </div>
            </div>
            <div>
              <div className="text-[#5A6A82] font-bold uppercase tracking-wider">
                Period
              </div>
              <div className="font-semibold text-[#1A2A4A] mt-0.5">
                {fromDate} to {toDate}
              </div>
            </div>
          </div>

          {/* Mobile Card View (shown when on mobile and cards view is active) */}
          <div className={`space-y-3 mb-6 no-print ${mobileViewMode === 'cards' ? 'block md:hidden' : 'hidden'}`}>
            {reportEntries.length === 0 ? (
              <div className="text-center py-8 text-[#8A99AE] text-sm border border-[#D4DEF0] rounded-lg">
                No entries recorded for this period.
              </div>
            ) : (
              reportEntries.map((e, idx) => (
                <div
                  key={e.id}
                  className="bg-[#FAFBFE] border border-[#D4DEF0] rounded-lg p-3.5 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-[#E8EEF8] pb-2">
                    <div>
                      <span className="font-bold text-[#003087] text-sm">
                        #{idx + 1} · {formatDate(e.date)}
                      </span>
                      <span className="text-[#8A99AE] text-xs ml-2">{e.startTime}</span>
                    </div>
                    <span
                      className="bg-[#003087] text-white text-xs font-bold font-mono px-2.5 py-0.5 rounded-full"
                    >
                      {e.actualCMR ? `${e.km} KM` : 'Ongoing'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#5A6A82] block text-[10px] uppercase font-bold">Route</span>
                      <span className="font-medium text-[#1A2A4A]">
                        {e.startStation} → {e.endStation || 'In Progress'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5A6A82] block text-[10px] uppercase font-bold">Officer</span>
                      <span className="font-medium text-[#003087]">@{e.user}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded border border-[#E8EEF8] font-mono">
                    <div>
                      <span className="text-[#8A99AE] text-[10px] block">Logbook OMR (Act)</span>
                      <strong>{e.logbookOMR}</strong> <span className="text-[#8A99AE]">({e.actualOMR})</span>
                    </div>
                    <div>
                      <span className="text-[#8A99AE] text-[10px] block">Logbook CMR (Act)</span>
                      <strong>{e.actualCMR ? e.logbookCMR : 'Pending'}</strong>{' '}
                      {e.actualCMR ? <span className="text-[#8A99AE]">({e.actualCMR})</span> : null}
                    </div>
                  </div>

                  {e.placesVisited && (
                    <div className="text-xs">
                      <span className="text-[#5A6A82] font-semibold">Places: </span>
                      <span className="text-[#1A2A4A]">{e.placesVisited}</span>
                    </div>
                  )}

                  {e.purpose && (
                    <div className="text-xs">
                      <span className="text-[#5A6A82] font-semibold">Purpose: </span>
                      <span className="text-[#1A2A4A]">{e.purpose}</span>
                    </div>
                  )}

                  {e.remarks && (
                    <div className="text-xs text-[#8A99AE]">
                      <span className="font-semibold">Remarks: </span>
                      <span>{e.remarks}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Standard Table View (Always used for Print and larger screens) */}
          <div
            className={`overflow-x-auto mb-6 print:block ${
              mobileViewMode === 'table' ? 'block' : 'hidden md:block'
            }`}
          >
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Date
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Start Station
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Logbook OMR
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Places Visited
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Purpose / Details
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    End Station
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Logbook CMR
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    KM
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Officer
                  </th>
                  <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-8 text-[#8A99AE] text-sm border border-[#D4DEF0]"
                    >
                      No entries recorded for {formatMonthYear(selectedYear, selectedMonth)}.
                    </td>
                  </tr>
                ) : (
                  reportEntries.map((e) => (
                    <tr key={e.id}>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif" }}>
                        <div className="whitespace-nowrap font-medium">{formatDate(e.date)}</div>
                        <div className="text-[#8A99AE] text-[10px]">{e.startTime}</div>
                      </td>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif" }}>
                        {e.startStation}
                      </td>
                      <td
                        className={`${tdClass} text-center font-mono`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {e.logbookOMR}
                      </td>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>
                        {e.placesVisited || '—'}
                      </td>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>
                        {e.purpose || '—'}
                      </td>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif" }}>
                        {e.endStation || '—'}
                      </td>
                      <td
                        className={`${tdClass} text-center font-mono`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {e.actualCMR ? e.logbookCMR : <span className="text-amber-600 italic">Pending</span>}
                      </td>
                      <td
                        className={`${tdClass} text-center font-bold`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {e.actualCMR ? e.km : <span className="text-amber-600 text-xs">Ongoing</span>}
                      </td>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>
                        @{e.user}
                      </td>
                      <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>
                        {e.remarks || ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#F5F8FD]">
                  <td
                    colSpan={7}
                    className="border border-[#C8D5EB] px-2.5 py-2 text-xs font-bold text-right text-[#1A2A4A]"
                    style={{ fontFamily: "'Work Sans', sans-serif" }}
                  >
                    Statement Total KM ({reportEntries.length} trips)
                  </td>
                  <td
                    className="border border-[#C8D5EB] px-2.5 py-2 text-center font-bold text-[#003087]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {reportUsedKm}
                  </td>
                  <td colSpan={2} className="border border-[#C8D5EB]" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Monthly Allowance & Usage Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 text-xs">
            <div className="border border-[#D4DEF0] rounded-lg p-3 text-center bg-[#FAFBFE]">
              <div
                className="text-[#8A99AE] font-bold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Monthly Allowance
              </div>
              <div
                className="font-bold text-[#003087] text-lg sm:text-xl font-mono"
              >
                {monthlyAllowance} KM
              </div>
            </div>

            <div className="border border-[#D4DEF0] rounded-lg p-3 text-center bg-[#FAFBFE]">
              <div
                className="text-[#8A99AE] font-bold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Vehicle Total Used
              </div>
              <div
                className="font-bold text-[#1A2A4A] text-lg sm:text-xl font-mono"
              >
                {totalVehicleUsed} KM
              </div>
            </div>

            <div className="border border-[#D4DEF0] rounded-lg p-3 text-center bg-[#FAFBFE]">
              <div
                className="text-[#8A99AE] font-bold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Statement Distance
              </div>
              <div
                className="font-bold text-[#003087] text-lg sm:text-xl font-mono"
              >
                {reportUsedKm} KM
              </div>
            </div>

            <div className="border border-[#D4DEF0] rounded-lg p-3 text-center bg-[#FAFBFE]">
              <div
                className="text-[#8A99AE] font-bold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Vehicle Remaining
              </div>
              <div
                className={`font-bold text-lg sm:text-xl font-mono ${
                  vehicleRemainingKm <= 0 ? 'text-red-600' : 'text-green-700'
                }`}
              >
                {vehicleRemainingKm} KM
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-[#D4DEF0]">
            <div>
              <div className="h-10 border-b border-[#1A2A4A] mb-1" />
              <div className="text-xs text-[#5A6A82]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Prepared by
              </div>
              <div className="text-xs font-semibold text-[#1A2A4A]" style={{ fontFamily: "'Inter', sans-serif" }}>
                {currentUser.name}
              </div>
            </div>
            <div>
              <div className="h-10 border-b border-[#1A2A4A] mb-1" />
              <div className="text-xs text-[#5A6A82]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Checked by
              </div>
              <div className="text-xs font-semibold text-[#1A2A4A]" style={{ fontFamily: "'Inter', sans-serif" }}>
                AGM (Network), Attingal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
