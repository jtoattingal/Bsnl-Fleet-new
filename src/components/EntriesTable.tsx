import React, { useMemo } from 'react';
import { LogEntry } from '../types';
import { formatDate, sortEntriesChronologically } from '../constants';

interface EntriesTableProps {
  entries: LogEntry[];
  onEdit?: (entry: LogEntry) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  closedMonths?: string[];
  isMonthClosed?: boolean;
}

export function EntriesTable({
  entries,
  onEdit,
  isAdmin = false,
  onDelete,
  closedMonths = [],
  isMonthClosed = false,
}: EntriesTableProps) {
  const sortedEntries = useMemo(() => sortEntriesChronologically(entries), [entries]);

  if (sortedEntries.length === 0) {
    return (
      <div
        className="p-8 text-center text-[#8A99AE] text-sm"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        No logbook entries found.
      </div>
    );
  }

  const thClass =
    'bg-[#F5F8FD] text-[#003087] text-xs font-semibold px-3 py-2.5 text-left border-b border-[#D4DEF0] uppercase tracking-wider';
  const tdClass = 'px-3 py-2.5 text-sm text-[#1A2A4A] border-b border-[#EEF2F9] align-top';

  return (
    <div>
      {/* Mobile Responsive Cards (Visible on mobile screens) */}
      <div className="block sm:hidden divide-y divide-[#EEF2F9]">
        {sortedEntries.map((entry) => {
          const entryMonth = entry.date ? entry.date.slice(0, 7) : '';
          const isEntryClosed = (closedMonths && closedMonths.includes(entryMonth)) || Boolean(isMonthClosed);
          const canEdit = !isAdmin && Boolean(onEdit) && !isEntryClosed;
          const isPending = entry.status === 'pending' || (!entry.actualCMR && !entry.placesVisited);

          return (
            <div key={entry.id} className="p-3.5 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#003087] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-[#8A99AE] text-xs ml-2 font-mono">{entry.startTime}</span>
                </div>
                <div>
                  {isPending ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                      Ongoing ⏳
                    </span>
                  ) : (
                    <span className="bg-[#E8F1FC] text-[#003087] text-xs font-bold font-mono px-2 py-0.5 rounded">
                      {entry.km} KM
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#5A6A82] text-[10px] uppercase font-bold block">Route</span>
                  <span className="font-medium text-[#1A2A4A] break-words">
                    {entry.startStation} → {isPending ? 'In Progress' : entry.endStation}
                  </span>
                </div>
                <div>
                  <span className="text-[#5A6A82] text-[10px] uppercase font-bold block">Officer</span>
                  <span className="font-medium text-[#003087]">@{entry.user}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FAFD] p-2 rounded border border-[#E8EEF8] font-mono">
                <div>
                  <span className="text-[#8A99AE] text-[10px] block">OMR (Log / Act)</span>
                  <span className="text-[#003087] font-bold">{entry.logbookOMR}</span>{' '}
                  <span className="text-[#8A99AE]">({entry.actualOMR})</span>
                </div>
                <div>
                  <span className="text-[#8A99AE] text-[10px] block">CMR (Log / Act)</span>
                  {isPending ? (
                    <span className="text-amber-600 italic">Pending</span>
                  ) : (
                    <>
                      <span className="text-[#003087] font-bold">{entry.logbookCMR}</span>{' '}
                      <span className="text-[#8A99AE]">({entry.actualCMR})</span>
                    </>
                  )}
                </div>
              </div>

              {entry.placesVisited && (
                <div className="text-xs break-words">
                  <span className="text-[#5A6A82] font-semibold">Places: </span>
                  <span className="text-[#1A2A4A]">{entry.placesVisited}</span>
                </div>
              )}

              {entry.purpose && (
                <div className="text-xs break-words">
                  <span className="text-[#5A6A82] font-semibold">Purpose: </span>
                  <span className="text-[#1A2A4A]">{entry.purpose}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9]">
                <span className="text-[11px] text-[#8A99AE] truncate max-w-[200px]">
                  {entry.remarks ? entry.remarks : ''}
                </span>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit?.(entry)}
                      className={
                        isPending
                          ? 'bg-[#003087] hover:bg-[#00236A] text-white text-xs px-3 py-1 rounded font-bold shadow-xs cursor-pointer'
                          : 'text-[#0055C8] text-xs hover:underline font-semibold cursor-pointer'
                      }
                    >
                      {isPending ? 'Complete Trip' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / Tablet Standard Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Date & Time
              </th>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Route
              </th>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                OMR
              </th>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Places Visited
              </th>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Purpose / Details
              </th>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                End
              </th>
              <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                CMR
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
              {(!isAdmin && Boolean(onEdit)) && (
                <th className={thClass} style={{ fontFamily: "'Work Sans', sans-serif" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry, idx) => {
              const entryMonth = entry.date ? entry.date.slice(0, 7) : '';
              const isEntryClosed = (closedMonths && closedMonths.includes(entryMonth)) || Boolean(isMonthClosed);
              const canEdit = !isAdmin && Boolean(onEdit) && !isEntryClosed;
              const isPending = entry.status === 'pending' || (!entry.actualCMR && !entry.placesVisited);

              return (
                <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFE]'}>
                  <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="whitespace-nowrap font-medium">{formatDate(entry.date)}</div>
                    <div className="text-[#8A99AE] text-xs font-mono">{entry.startTime}</div>
                  </td>
                  <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div>{entry.startStation}</div>
                    <div className={isPending ? 'text-amber-600 text-[11px] font-bold' : 'text-[#8A99AE] text-xs'}>
                      → {isPending ? 'In Progress ⏳' : entry.endStation}
                    </div>
                  </td>
                  <td className={tdClass}>
                    <div
                      className="font-mono text-xs text-[#003087]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {entry.logbookOMR}
                    </div>
                    <div
                      className="text-[#8A99AE] text-xs font-mono"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      act: {entry.actualOMR}
                    </div>
                  </td>
                  <td className={`${tdClass} max-w-[160px]`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {isPending ? (
                      <span className="text-amber-700 italic text-xs font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                        ⏳ Pending completion
                      </span>
                    ) : (
                      <div className="text-xs leading-relaxed">{entry.placesVisited}</div>
                    )}
                  </td>
                  <td className={`${tdClass} max-w-[180px]`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {isPending ? (
                      <span className="text-amber-700 italic text-xs font-medium">
                        {entry.purpose || 'Trip in progress'}
                      </span>
                    ) : (
                      <div className="text-xs leading-relaxed">{entry.purpose}</div>
                    )}
                  </td>
                  <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {isPending ? <span className="text-[#8A99AE] text-xs">—</span> : entry.endStation}
                  </td>
                  <td className={tdClass}>
                    {isPending ? (
                      <span className="text-amber-600 text-xs italic font-semibold">Pending</span>
                    ) : (
                      <>
                        <div
                          className="font-mono text-xs text-[#003087]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {entry.logbookCMR}
                        </div>
                        <div
                          className="text-[#8A99AE] text-xs font-mono"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          act: {entry.actualCMR}
                        </div>
                      </>
                    )}
                  </td>
                  <td className={tdClass}>
                    {isPending ? (
                      <span
                        className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                        style={{ fontFamily: "'Work Sans', sans-serif" }}
                      >
                        Ongoing
                      </span>
                    ) : (
                      <span
                        className="text-[#003087] font-bold font-mono"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {entry.km}
                      </span>
                    )}
                  </td>
                  <td className={tdClass} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>
                    @{entry.user}
                  </td>
                  <td className={`${tdClass} text-xs text-[#8A99AE]`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {entry.remarks || '—'}
                  </td>
                  {(!isAdmin && Boolean(onEdit)) && (
                    <td className={tdClass}>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit?.(entry)}
                            className={
                              isPending
                                ? 'bg-[#003087] hover:bg-[#00236A] text-white text-xs px-2.5 py-1 rounded font-bold shadow-xs whitespace-nowrap cursor-pointer'
                                : 'text-[#0055C8] text-xs hover:underline font-medium cursor-pointer'
                            }
                          >
                            {isPending ? 'Complete Trip' : 'Edit'}
                          </button>
                        )}
                        {!canEdit && (
                          <span className="text-xs text-[#8A99AE]">🔒 Closed</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
