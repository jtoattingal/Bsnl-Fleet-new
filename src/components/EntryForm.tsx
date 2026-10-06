import React, { useState, useMemo } from 'react';
import { StationCalcCard } from './StationCalcCard';
import { LogEntry, Station, User } from '../types';
import { calcOpeningOMR, calcClosingCMR } from '../constants';

interface EntryFormProps {
  currentUser: User;
  onSave: (entry: LogEntry) => void;
  onCancel: () => void;
  editEntry?: LogEntry;
  closedMonths?: string[];
  isAdmin?: boolean;
  existingEntries?: LogEntry[];
}

export function EntryForm({
  currentUser,
  onSave,
  onCancel,
  editEntry,
  closedMonths = [],
  isAdmin = false,
  existingEntries = [],
}: EntryFormProps) {
  // Determine if this is completing an existing pending trip
  const isCompletingPending = Boolean(
    editEntry &&
      (editEntry.status === 'pending' || (!editEntry.actualCMR && !editEntry.placesVisited))
  );

  // Form mode: 'start-only' (OMR only / pending) or 'complete' (full trip)
  const [formMode, setFormMode] = useState<'start-only' | 'complete'>(() => {
    if (isCompletingPending) return 'complete';
    if (editEntry) return 'complete';
    return 'start-only';
  });

  // Find previous completed trip for reference
  const previousTrip = useMemo(() => {
    if (!existingEntries || existingEntries.length === 0) return null;
    const sorted = [...existingEntries]
      .filter((e) => e.id !== editEntry?.id && Number(e.actualCMR) > 0)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
    return sorted.length > 0 ? sorted[sorted.length - 1] : null;
  }, [existingEntries, editEntry]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const nowTimeStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  // Form fields - defaults to current date and time on entry, fully editable by the user
  const [date, setDate] = useState(editEntry?.date || todayStr);
  const [startTime, setStartTime] = useState(editEntry?.startTime || nowTimeStr);
  const [startStation, setStartStation] = useState<Station>(
    editEntry?.startStation || previousTrip?.endStation || 'Attingal'
  );

  // Suggest previous trip's closing meter if available, or user inputs freely
  const [actualOMRStr, setActualOMRStr] = useState(() => {
    if (editEntry?.actualOMR) return editEntry.actualOMR.toString();
    if (previousTrip?.actualCMR) return previousTrip.actualCMR.toString();
    return '';
  });

  const [placesVisited, setPlacesVisited] = useState(editEntry?.placesVisited || '');
  const [purpose, setPurpose] = useState(editEntry?.purpose || '');
  const [endStation, setEndStation] = useState<Station>(editEntry?.endStation || startStation || 'Attingal');
  const [actualCMRStr, setActualCMRStr] = useState(
    editEntry?.actualCMR && editEntry.actualCMR > 0 ? editEntry.actualCMR.toString() : ''
  );
  const [remarks, setRemarks] = useState(editEntry?.remarks || '');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const numOMR = parseFloat(actualOMRStr);
  const numCMR = parseFloat(actualCMRStr);

  const logOMR = isNaN(numOMR) ? null : calcOpeningOMR(numOMR, startStation);
  const logCMR = isNaN(numCMR) ? null : calcClosingCMR(numCMR, endStation);
  const tripKm = logOMR !== null && logCMR !== null && numCMR > numOMR ? logCMR - logOMR : null;

  async function handleSave(asPending = false) {
    setError('');

    if (!date) {
      setError('Please select or enter the date of entry.');
      return;
    }

    if (!startTime) {
      setError('Please set the starting time.');
      return;
    }

    if (!actualOMRStr || isNaN(numOMR) || numOMR <= 0) {
      setError('Please enter a valid Opening Meter Reading (OMR).');
      return;
    }

    // Closed month check
    const monthKey = date.slice(0, 7);
    if (closedMonths.includes(monthKey) && !isAdmin) {
      setError('This month has been closed by the Administrator. Entries cannot be modified.');
      return;
    }

    // If saving as pending (Start Journey only)
    if (asPending || formMode === 'start-only') {
      const pendingEntry: LogEntry = {
        id: editEntry?.id || Date.now().toString(),
        date,
        startTime,
        startStation,
        actualOMR: numOMR,
        logbookOMR: calcOpeningOMR(numOMR, startStation),
        placesVisited: placesVisited || '',
        purpose: purpose || '',
        endStation: endStation || startStation,
        actualCMR: 0,
        logbookCMR: 0,
        km: 0,
        remarks: remarks || '',
        user: editEntry ? editEntry.user : currentUser.username,
        status: 'pending',
      };

      setSaving(true);
      try {
        await onSave(pendingEntry);
        setSuccess(true);
        setTimeout(() => {
          onCancel();
        }, 600);
      } catch (err: any) {
        console.error('Error saving pending entry:', err);
        setError(err?.message || 'Error occurred while saving pending trip.');
      } finally {
        setSaving(false);
      }
      return;
    }

    // Complete / Close trip validations
    if (!placesVisited || !placesVisited.trim()) {
      setError('Please specify the places visited.');
      return;
    }

    if (!purpose || !purpose.trim()) {
      setError('Please specify the purpose of the journey.');
      return;
    }

    if (!actualCMRStr || isNaN(numCMR)) {
      setError('Please enter a valid Closing Meter Reading (CMR).');
      return;
    }

    if (numCMR <= numOMR) {
      setError(`Closing meter reading (${numCMR} KM) must be strictly greater than opening meter reading (${numOMR} KM).`);
      return;
    }

    const calculatedLogOMR = calcOpeningOMR(numOMR, startStation);
    const calculatedLogCMR = calcClosingCMR(numCMR, endStation);
    const calculatedKm = Math.max(calculatedLogCMR - calculatedLogOMR, 0);

    const completedEntry: LogEntry = {
      id: editEntry?.id || Date.now().toString(),
      date,
      startTime,
      startStation,
      actualOMR: numOMR,
      logbookOMR: calculatedLogOMR,
      placesVisited,
      purpose,
      endStation,
      actualCMR: numCMR,
      logbookCMR: calculatedLogCMR,
      km: calculatedKm,
      remarks,
      user: editEntry ? editEntry.user : currentUser.username,
      status: 'completed',
    };

    setSaving(true);
    try {
      await onSave(completedEntry);
      setSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 600);
    } catch (err: any) {
      console.error('Error saving completed entry:', err);
      setError(err?.message || 'Error occurred while saving trip.');
    } finally {
      setSaving(false);
    }
  }

  const labelClass = 'block text-[#5A6A82] text-xs font-semibold mb-1 uppercase tracking-wider';
  const inputClass =
    'w-full border border-[#C8D5EB] rounded px-3 py-2 text-sm text-[#1A2A4A] focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087] bg-white';

  return (
    <div className="bg-[#EEF2F9] min-h-screen pb-12">
      <div className="bg-white border-b border-[#D4DEF0] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div>
          <h2
            className="text-[#003087] font-bold text-base flex items-center gap-2"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            {isCompletingPending
              ? 'Complete Ongoing Trip'
              : editEntry
              ? 'Edit Log Entry'
              : 'New Vehicle Entry'}
          </h2>
          <span className="text-[11px] text-[#5A6A82]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Officer: <strong>{editEntry ? editEntry.user : currentUser.name}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[#5A6A82] text-sm hover:text-[#003087] cursor-pointer font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ✕ Cancel
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Banner when completing an existing pending trip */}
        {isCompletingPending && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3.5 text-amber-900 text-xs shadow-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm text-amber-800">
              <span>⏳</span>
              <span>Completing Trip in Progress</span>
            </div>
            <p>
              Started on <strong>{editEntry?.date}</strong> at <strong>{editEntry?.startTime}</strong> from{' '}
              <strong>{editEntry?.startStation}</strong> with OMR <strong>{editEntry?.actualOMR} KM</strong>.
            </p>
            <p className="text-amber-700">
              Please enter the ending station, closing meter reading (CMR), and places visited to close this trip.
            </p>
          </div>
        )}

        {/* Mode Selector for New Entry */}
        {!editEntry && (
          <div className="bg-white border border-[#D4DEF0] rounded-lg p-1.5 flex gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setFormMode('start-only');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded transition-all cursor-pointer text-center ${
                formMode === 'start-only'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'text-[#5A6A82] hover:text-[#003087] hover:bg-[#F1F5F9]'
              }`}
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              🚀 Start Trip (OMR Only)
            </button>
            <button
              type="button"
              onClick={() => {
                setFormMode('complete');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded transition-all cursor-pointer text-center ${
                formMode === 'complete'
                  ? 'bg-[#003087] text-white shadow-xs'
                  : 'text-[#5A6A82] hover:text-[#003087] hover:bg-[#F1F5F9]'
              }`}
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              📋 Complete Trip (Full Details)
            </button>
          </div>
        )}

        {success && (
          <div
            className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm font-medium text-center"
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            ✓ Logbook entry saved successfully!
          </div>
        )}

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-xs font-semibold"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Section 1: Journey Start */}
        <div className="bg-white border border-[#D4DEF0] rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEF2F9] pb-2">
            <h3
              className="text-[#003087] font-bold text-xs uppercase tracking-wider"
              style={{ fontFamily: "'Work Sans', sans-serif" }}
            >
              1. Journey Start Details
            </h3>
            <span className="text-[11px] text-[#5A6A82]">
              {formMode === 'start-only' ? 'Required for starting trip' : 'Stage 1'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Date of Entry *
              </label>
              <input
                type="date"
                className={inputClass}
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <span className="text-[10px] text-[#8A99AE]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Select any date for this trip
              </span>
            </div>
            <div>
              <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Start Time *
              </label>
              <input
                type="time"
                className={inputClass}
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span className="text-[10px] text-[#8A99AE]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Set vehicle boarding / call time
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
              Starting Station *
            </label>
            <select
              className={inputClass}
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={startStation}
              onChange={(e) => {
                const s = e.target.value as Station;
                setStartStation(s);
                if (formMode === 'start-only' || !endStation) {
                  setEndStation(s);
                }
              }}
            >
              <option value="Attingal">Attingal (Offset: -5 KM)</option>
              <option value="Kallambalam">Kallambalam (Offset: -14 KM)</option>
              <option value="Kilimanoor">Kilimanoor (Offset: -17 KM)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Opening Meter Reading - Actual OMR (KM) *
              </label>
              {previousTrip && (
                <span className="text-[11px] text-[#5A6A82]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Prev CMR: <strong className="font-mono text-[#003087]">{previousTrip.actualCMR} KM</strong>
                </span>
              )}
            </div>
            <input
              type="number"
              className={`${inputClass} font-mono text-base font-semibold`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              value={actualOMRStr}
              onChange={(e) => setActualOMRStr(e.target.value)}
              placeholder="e.g. 15200"
            />
          </div>

          {!isNaN(numOMR) && actualOMRStr && (
            <StationCalcCard
              label="Opening Calculation (Station Offset Applied)"
              actualMeter={numOMR}
              station={startStation}
              isOpening={true}
            />
          )}

          {/* Quick Start Trip Button if in start-only mode */}
          {formMode === 'start-only' && (
            <div className="pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="w-full bg-[#003087] hover:bg-[#00236A] text-white font-bold py-3 rounded text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                <span>🚀</span>
                <span>{saving ? 'Starting Journey...' : 'Start Trip & Save as Pending'}</span>
              </button>
              <p className="text-[11px] text-[#5A6A82] text-center mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                Save with date, time, and OMR at trip start. You can close and complete the trip with final readings after the journey.
              </p>
            </div>
          )}
        </div>

        {/* Section 2 & 3: Journey Details & End (Visible in complete mode or when completing pending) */}
        {(formMode === 'complete' || isCompletingPending) && (
          <>
            <div className="bg-white border border-[#D4DEF0] rounded-lg p-4 space-y-3 shadow-xs">
              <h3
                className="text-[#003087] font-bold text-xs uppercase tracking-wider border-b border-[#EEF2F9] pb-2"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                2. Journey Details
              </h3>
              <div>
                <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Places Visited *
                </label>
                <textarea
                  className={`${inputClass} resize-none`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  rows={2}
                  value={placesVisited}
                  onChange={(e) => setPlacesVisited(e.target.value)}
                  placeholder="e.g. Attingal, Varkala, Chirayinkeezhu, Kallambalam"
                />
              </div>

              <div>
                <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Purpose / Details of Journey *
                </label>
                <textarea
                  className={`${inputClass} resize-none`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. BTS maintenance, battery reading inspection, cable breakdown check"
                />
              </div>
            </div>

            <div className="bg-white border border-[#D4DEF0] rounded-lg p-4 space-y-3 shadow-xs">
              <h3
                className="text-[#003087] font-bold text-xs uppercase tracking-wider border-b border-[#EEF2F9] pb-2"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                3. Journey End Details
              </h3>
              <div>
                <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Ending Station *
                </label>
                <select
                  className={inputClass}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={endStation}
                  onChange={(e) => setEndStation(e.target.value as Station)}
                >
                  <option value="Attingal">Attingal (Offset: +5 KM)</option>
                  <option value="Kallambalam">Kallambalam (Offset: +14 KM)</option>
                  <option value="Kilimanoor">Kilimanoor (Offset: +17 KM)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                    Actual Closing Meter Reading - Actual CMR (KM) *
                  </label>
                  <span className="text-[11px] text-[#5A6A82]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Must be &gt; OMR ({numOMR || 0} KM)
                  </span>
                </div>
                <input
                  type="number"
                  className={`${inputClass} font-mono text-base font-semibold`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  value={actualCMRStr}
                  onChange={(e) => setActualCMRStr(e.target.value)}
                  placeholder="e.g. 15265"
                />
              </div>

              {!isNaN(numCMR) && actualCMRStr && (
                <StationCalcCard
                  label="Closing Calculation (Station Offset Applied)"
                  actualMeter={numCMR}
                  station={endStation}
                  isOpening={false}
                />
              )}

              {tripKm !== null && (
                <div className="bg-[#003087] text-white rounded-lg p-3.5 flex justify-between items-center shadow-xs">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-200" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                      Total Logbook KM for this Trip
                    </div>
                    <div className="text-xs text-blue-200 mt-0.5">
                      Actual Vehicle Distance: <strong className="text-white">{numCMR - numOMR} KM</strong>
                    </div>
                  </div>
                  <span
                    className={`text-2xl font-black ${tripKm <= 0 ? 'text-red-300' : 'text-white'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {tripKm <= 0 ? `⚠ ${tripKm}` : `${tripKm} KM`}
                  </span>
                </div>
              )}

              <div>
                <label className={labelClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Remarks (Optional)
                </label>
                <input
                  className={inputClass}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                />
              </div>
            </div>

            {/* Complete & Close Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className={`flex-1 bg-[#003087] hover:bg-[#00236A] text-white font-bold py-3.5 rounded text-sm transition-colors cursor-pointer shadow-sm ${
                  saving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                {saving
                  ? 'Saving to Database...'
                  : isCompletingPending
                  ? '✓ Complete & Close Trip'
                  : editEntry
                  ? 'Update Log Entry'
                  : 'Save Completed Log Entry'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onCancel}
                className="px-6 border border-[#C8D5EB] text-[#5A6A82] hover:border-[#003087] hover:text-[#003087] font-medium py-3 rounded text-sm transition-colors cursor-pointer bg-white"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
