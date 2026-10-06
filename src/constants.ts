import { LogEntry, RouteStep, Station, User } from './types';

export const STATION_OFFSETS: Record<Station, number> = {
  Attingal: 5,
  Kallambalam: 14,
  Kilimanoor: 17,
};

export const OPENING_STEPS: Record<Station, RouteStep[]> = {
  Attingal: [{ label: 'Garage → Attingal', km: 5 }],
  Kallambalam: [
    { label: 'Garage → Attingal', km: 5 },
    { label: 'Attingal → Kallambalam', km: 9 },
  ],
  Kilimanoor: [
    { label: 'Garage → Attingal', km: 5 },
    { label: 'Attingal → Kilimanoor', km: 12 },
  ],
};

export const CLOSING_STEPS: Record<Station, RouteStep[]> = {
  Attingal: [{ label: 'Attingal → Garage', km: 5 }],
  Kallambalam: [
    { label: 'Kallambalam → Attingal', km: 9 },
    { label: 'Attingal → Garage', km: 5 },
  ],
  Kilimanoor: [
    { label: 'Kilimanoor → Attingal', km: 12 },
    { label: 'Attingal → Garage', km: 5 },
  ],
};

export const DEFAULT_VEHICLE_REGISTRATION = 'KL 19 L 6865';
export const DEFAULT_MONTHLY_ALLOWANCE = 2000;
export const DEFAULT_VEHICLE_IMG = '/vehicle.jpeg';
export const DEFAULT_LOGO_URL = '/bsnllogo.png';
 
export const DEFAULT_USERS: User[] = [
  {
    id: "1",
    username: "jto_attingal",
    name: "JTO (Network), Attingal",
    designation: "Junior Telecom Officer (Network)",
    password: "Bsnl",
    active: true,
  },
  {
    id: "2",
    username: "jto_varkala",
    name: "JTO (Network), Varkala",
    designation: "Junior Telecom Officer (Network)",
    password: "Bsnl",
    active: true,
  },
  {
    id: "3",
    username: "sde_kilimanoor",
    name: "SDE (Network), Kilimanoor",
    designation: "Sub-Divisional Engineer (Network)",
    password: "Bsnl",
    active: true,
  },
  {
    id: "4",
    username: "agm_attingal",
    name: "AGM (Network), Attingal",
    designation: "Assistant General Manager (Network)",
    password: "Bsnl",
    active: true,
  },
];

export const DEFAULT_ENTRIES: LogEntry[] = [
  {
    "id": "1791198058998",
    "date": "2026-09-03",
    "startTime": "10:00",
    "startStation": "Kallambalam",
    "actualOMR": 109849,
    "logbookOMR": 109835,
    "placesVisited": "Kallambalam, Edava, Varkala",
    "purpose": "Site inspection",
    "endStation": "Kallambalam",
    "actualCMR": 109879,
    "logbookCMR": 109893,
    "km": 58,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1791198171807",
    "date": "2026-09-04",
    "startTime": "10:00",
    "startStation": "Kallambalam",
    "actualOMR": 109913,
    "logbookOMR": 109899,
    "placesVisited": "Kallambalam, rrc, tvm",
    "purpose": "Module Repair",
    "endStation": "Kallambalam",
    "actualCMR": 110008,
    "logbookCMR": 110022,
    "km": 123,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1788863719107",
    "date": "2026-09-08",
    "startTime": "10:00",
    "startStation": "Kallambalam",
    "actualOMR": 110041,
    "logbookOMR": 110027,
    "placesVisited": "Kallambalam, varkala, Kallambalam, Vanchiyoor, Nedumparambu, Nagaroor, Kilimanoor, Alavacode, Thattathumala Kilimanoor ",
    "purpose": "Site visit",
    "endStation": "Kilimanoor",
    "actualCMR": 110105,
    "logbookCMR": 110122,
    "km": 95,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1788942831494",
    "date": "2026-09-09",
    "startTime": "09:30",
    "startStation": "Attingal",
    "actualOMR": 110148,
    "logbookOMR": 110143,
    "placesVisited": "RRC, CTX, PGMO ",
    "purpose": "Module repair, AO visit",
    "endStation": "Attingal",
    "actualCMR": 110221,
    "logbookCMR": 110226,
    "km": 83,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1789126365056",
    "date": "2026-09-11",
    "startTime": "13:00",
    "startStation": "Kilimanoor",
    "actualOMR": 110242,
    "logbookOMR": 110225,
    "placesVisited": "Kilimanoor, Nagaroor, Koduvazhannoor, Kilimanoor, Pallickal, Moothala, Kilimanoor, Vellalloor, Kilimanoor ",
    "purpose": "Site inspection, coverage issue, nagaroor tower painting.",
    "endStation": "Kilimanoor",
    "actualCMR": 110296,
    "logbookCMR": 110313,
    "km": 88,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1789198590234",
    "date": "2026-09-12",
    "startTime": "11:00",
    "startStation": "Kilimanoor",
    "actualOMR": 110304,
    "logbookOMR": 110287,
    "placesVisited": "Ponganadu, panappamkunnu, mathayil, KEEZHPEROOR, Kilimanoor ",
    "purpose": "Coverage test, panappamkunnu painting",
    "endStation": "Kilimanoor",
    "actualCMR": 110328,
    "logbookCMR": 110345,
    "km": 58,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1789382694302",
    "date": "2026-09-14",
    "startTime": "09:45",
    "startStation": "Attingal",
    "actualOMR": 110350,
    "logbookOMR": 110345,
    "placesVisited": "Mananak, Kadakkavoor TE, Anjengo",
    "purpose": "Tower painting, SMPS replacement, Card replacement ",
    "endStation": "Attingal",
    "actualCMR": 110401,
    "logbookCMR": 110406,
    "km": 61,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1789470937912",
    "date": "2026-09-15",
    "startTime": "10:00",
    "startStation": "Kallambalam",
    "actualOMR": 110434,
    "logbookOMR": 110420,
    "placesVisited": "Attingal, PGMO, RRC",
    "purpose": "DE office, module repair, bill submit ",
    "endStation": "Kallambalam",
    "actualCMR": 110523,
    "logbookCMR": 110537,
    "km": 117,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1789550832270",
    "date": "2026-09-16",
    "startTime": "11:00",
    "startStation": "Kilimanoor",
    "actualOMR": 110540,
    "logbookOMR": 110523,
    "placesVisited": "Kilimanoor, Thumbode, Madavoor, Kilimanoor ",
    "purpose": "Site ",
    "endStation": "Kilimanoor",
    "actualCMR": 110567,
    "logbookCMR": 110584,
    "km": 61,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1789651638396",
    "date": "2026-09-17",
    "startTime": "10:30",
    "startStation": "Attingal",
    "actualOMR": 110584,
    "logbookOMR": 110579,
    "placesVisited": "Ooroopoka, CTX, Cheruvalimuk, Mudapuram, Sarkkara, Chirayinkil, Perumkuzhi ",
    "purpose": "Oorupoika 2G fault fixing, Delta module collection for ATT, Site visit, coverage test, Pzy Rly 4G fault fix",
    "endStation": "Attingal",
    "actualCMR": 110689,
    "logbookCMR": 110694,
    "km": 115,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1789968981162",
    "date": "2026-09-19",
    "startTime": "09:00",
    "startStation": "Kilimanoor",
    "actualOMR": 110711,
    "logbookOMR": 110694,
    "placesVisited": "Attingal, GM office, Central TE",
    "purpose": "Zte RRH collection, pp module if attingal d😁livery at CTX",
    "endStation": "Kilimanoor",
    "actualCMR": 110795,
    "logbookCMR": 110812,
    "km": 118,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1790144585621",
    "date": "2026-09-22",
    "startTime": "02:30",
    "startStation": "Attingal",
    "actualOMR": 110886,
    "logbookOMR": 110881,
    "placesVisited": "CTX, PGMO, Cheruvalimuk ",
    "purpose": "RRU collection for Cheruvalimuk, IB submission ",
    "endStation": "Attingal",
    "actualCMR": 110966,
    "logbookCMR": 110971,
    "km": 90,
    "remarks": "No night halt",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1790068773713",
    "date": "2026-09-22",
    "startTime": "09:30",
    "startStation": "Kallambalam",
    "actualOMR": 110817,
    "logbookOMR": 110803,
    "placesVisited": "Kallambalam",
    "purpose": "Site inspection ",
    "endStation": "Kallambalam",
    "actualCMR": 110853,
    "logbookCMR": 110867,
    "km": 64,
    "remarks": "",
    "user": "jto_varkala",
    "status": "completed"
  },
  {
    "id": "1790146219468",
    "date": "2026-09-23",
    "startTime": "09:30",
    "startStation": "Kallambalam",
    "actualOMR": 110998,
    "logbookOMR": 110984,
    "placesVisited": "Kavalayoor TE",
    "purpose": "Kavalayoor Liion Lineage BTY fault check with Lineage Engr (under warranty)",
    "endStation": "Kallambalam",
    "actualCMR": 111011,
    "logbookCMR": 111025,
    "km": 41,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1790162111926",
    "date": "2026-09-23",
    "startTime": "11:00",
    "startStation": "Kilimanoor",
    "actualOMR": 111022,
    "logbookOMR": 111005,
    "placesVisited": "Klx, Nagaroor, klx, Koduvazhannoor, KLx",
    "purpose": "Powerplant LVD change, Koduvazhannoor battery cln energy team visit",
    "endStation": "Kilimanoor",
    "actualCMR": 111051,
    "logbookCMR": 111068,
    "km": 63,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1790252777811",
    "date": "2026-09-24",
    "startTime": "10:00",
    "startStation": "Kilimanoor",
    "actualOMR": 111059,
    "logbookOMR": 111042,
    "placesVisited": "Pallickal, Kilimanoor, Pongandu, Nagaroor, Varkala nagaroor, Kallambalm, nagoor, Pallickal, Kilimanoor ",
    "purpose": "Site cleaning",
    "endStation": "Kilimanoor",
    "actualCMR": 111178,
    "logbookCMR": 111195,
    "km": 153,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1790595260839",
    "date": "2026-09-25",
    "startTime": "09:30",
    "startStation": "Kilimanoor",
    "actualOMR": 111187,
    "logbookOMR": 111170,
    "placesVisited": "KLX",
    "purpose": "Site inspection ",
    "endStation": "Kilimanoor",
    "actualCMR": 111266,
    "logbookCMR": 111283,
    "km": 113,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1790595891958",
    "date": "2026-09-26",
    "startTime": "09:00",
    "startStation": "Kilimanoor",
    "actualOMR": 111275,
    "logbookOMR": 111258,
    "placesVisited": "Kilimanoor, ponganad, Thakaraparamvu",
    "purpose": "Te visit and coverage complaint",
    "endStation": "Kilimanoor",
    "actualCMR": 111289,
    "logbookCMR": 111306,
    "km": 48,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1790595666584",
    "date": "2026-09-28",
    "startTime": "09:30",
    "startStation": "Kallambalam",
    "actualOMR": 111306,
    "logbookOMR": 111292,
    "placesVisited": "Vak",
    "purpose": "TE inspection ",
    "endStation": "Kallambalam",
    "actualCMR": 111337,
    "logbookCMR": 111351,
    "km": 59,
    "remarks": "",
    "user": "jto_attingal",
    "status": "completed"
  },
  {
    "id": "1790595977722",
    "date": "2026-09-28",
    "startTime": "10:00",
    "startStation": "Attingal",
    "actualOMR": 111348,
    "logbookOMR": 111343,
    "placesVisited": "Klx, Pallickal, Nagaroor, Klx, Aylam, Klx, Adayamon, klx",
    "purpose": "Site visit swarch baharat",
    "endStation": "Kilimanoor",
    "actualCMR": 111409,
    "logbookCMR": 111426,
    "km": 83,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1790745220455",
    "date": "2026-09-29",
    "startTime": "09:00",
    "startStation": "Kilimanoor",
    "actualOMR": 111418,
    "logbookOMR": 111401,
    "placesVisited": "Klx, Panappamkunnu, Pallickal, KLx",
    "purpose": "Battery testing",
    "endStation": "Kilimanoor",
    "actualCMR": 111447,
    "logbookCMR": 111464,
    "km": 63,
    "remarks": "",
    "user": "sde_kilimanoor",
    "status": "completed"
  },
  {
    "id": "1791003410380",
    "date": "2026-09-30",
    "startTime": "09:30",
    "startStation": "Kallambalam",
    "actualOMR": 111452,
    "logbookOMR": 111438,
    "placesVisited": "Klmbm, varkla, sivagiri, Airoor ",
    "purpose": "Site inspection ",
    "endStation": "Kallambalam",
    "actualCMR": 111540,
    "logbookCMR": 111554,
    "km": 116,
    "remarks": "",
    "user": "jto_varkala",
    "status": "completed"
  }
];

export const START_BREAKDOWNS: Record<string, RouteStep[]> = OPENING_STEPS;
export const END_BREAKDOWNS: Record<string, RouteStep[]> = CLOSING_STEPS;

export function calcLogbookOMR(actualOMR: number, station: Station | string): number {
  return actualOMR - (STATION_OFFSETS[station as Station] ?? 0);
}

export function calcLogbookCMR(actualCMR: number, station: Station | string): number {
  return actualCMR + (STATION_OFFSETS[station as Station] ?? 0);
}

export const calcOpeningOMR = calcLogbookOMR;
export const calcClosingCMR = calcLogbookCMR;

export function formatDisplayDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const formatDate = formatDisplayDate;

export function sortEntriesChronologically(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}

export function formatMonthYear(year: number, month: number): string {
  try {
    return new Date(year, month, 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return `${month + 1}/${year}`;
  }
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function isMonthEnded(year: number, month: number): boolean {
  const now = new Date();
  // The last millisecond of the month (month is 0-indexed)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return now.getTime() > endOfMonth.getTime();
}

export function isDateFuture(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr > today;
}

export function getFourthLastMonth(): { year: number; month: number; key: string; label: string } {
  const now = new Date();
  // 4th last month (e.g., if September 2026, 4 months ago is May 2026)
  const target = new Date(now.getFullYear(), now.getMonth() - 4, 1);
  const y = target.getFullYear();
  const m = target.getMonth();
  const key = `${y}-${String(m + 1).padStart(2, '0')}`;
  const label = formatMonthYear(y, m);
  return { year: y, month: m, key, label };
}
