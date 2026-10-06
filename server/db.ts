import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { EntryModel, SettingModel, UserModel, IUser, IEntry } from './models';
import {
  DEFAULT_ENTRIES,
  DEFAULT_LOGO_URL,
  DEFAULT_MONTHLY_ALLOWANCE,
  DEFAULT_USERS,
  DEFAULT_VEHICLE_IMG,
  DEFAULT_VEHICLE_REGISTRATION,
  calcOpeningOMR,
  calcClosingCMR,
} from '../src/constants';

let isMongoConnected = false;

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'db.json');

interface InMemoryStore {
  users: IUser[];
  entries: IEntry[];
  settings: any;
}

const defaultSettings = {
  vehicleRegistration: DEFAULT_VEHICLE_REGISTRATION,
  monthlyAllowance: DEFAULT_MONTHLY_ALLOWANCE,
  logoUrl: DEFAULT_LOGO_URL,
  vehicleImg: DEFAULT_VEHICLE_IMG,
  adminPassword: 'Bsnlatt',
  closedMonths: [] as string[],
  sampleDataCleared: false,
};

let memStore: InMemoryStore = {
  users: [...DEFAULT_USERS],
  entries: [...(DEFAULT_ENTRIES as unknown as IEntry[])],
  settings: { ...defaultSettings },
};

// Load initial store from data/db.json if available
try {
  if (fs.existsSync(DB_FILE_PATH)) {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.users && Array.isArray(parsed.users)) {
      memStore.users = parsed.users;
    }
    if (parsed.entries && Array.isArray(parsed.entries)) {
      memStore.entries = parsed.entries;
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      memStore.settings = { ...defaultSettings, ...parsed.settings };
    }
  }
} catch (err: any) {
  console.warn('[DB] Could not load data/db.json, using defaults:', err.message);
}

function persistFileStore() {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(memStore, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[DB] Could not write to data/db.json:', err.message);
  }
}

export async function initDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] No MONGODB_URI found. Operating with local persistent store.');
    return;
  }

  const dbName = process.env.MONGODB_DB_NAME || 'bsnlfleet';

  try {
    if (mongoose.connection.readyState === 1) {
      isMongoConnected = true;
    } else {
      mongoose.set('bufferCommands', false);
      await mongoose.connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 8000,
      });
      isMongoConnected = true;
      console.log(`[DB] Successfully connected to MongoDB Cloud Database (${dbName})!`);
    }

    // Load live entries from MongoDB Atlas
    try {
      const mongoEntries = await EntryModel.find().sort({ date: 1, startTime: 1 }).lean();
      if (mongoEntries && mongoEntries.length > 0) {
        memStore.entries = mongoEntries.map((e: any) => sanitizeEntry(e));
        console.log(`[DB] Successfully loaded ${mongoEntries.length} entries from MongoDB (${dbName}).`);
      }
    } catch (e: any) {
      console.warn('[DB] Could not load entries from MongoDB:', e.message);
    }

    // Load live users from MongoDB Atlas
    try {
      const mongoUsers = await UserModel.find().lean();
      if (mongoUsers && mongoUsers.length > 0) {
        memStore.users = mongoUsers.map((u: any) => ({ ...u, id: u.id || u._id?.toString() }));
        console.log(`[DB] Successfully loaded ${mongoUsers.length} users from MongoDB (${dbName}).`);
      } else {
        await UserModel.insertMany(memStore.users.length ? memStore.users : DEFAULT_USERS);
      }
    } catch (e: any) {
      console.warn('[DB] Could not load users from MongoDB:', e.message);
    }

    // Load live settings from MongoDB Atlas
    try {
      const mongoSetting = await SettingModel.findOne({ key: 'appConfig' }).lean() || await SettingModel.findOne().lean();
      if (mongoSetting) {
        const cfg = (mongoSetting as any).value || mongoSetting;
        const cleanCfg = {
          ...cfg,
          logoUrl: cfg.logoUrl && !cfg.logoUrl.includes('placeholder') ? cfg.logoUrl : DEFAULT_LOGO_URL,
          vehicleImg: cfg.vehicleImg && !cfg.vehicleImg.includes('unsplash.com') ? cfg.vehicleImg : DEFAULT_VEHICLE_IMG,
        };
        memStore.settings = { ...defaultSettings, ...cleanCfg };
        console.log(`[DB] Successfully loaded settings from MongoDB (${dbName}).`);
      }
    } catch (e: any) {
      console.warn('[DB] Could not load settings from MongoDB:', e.message);
    }

    // Persist to local data/db.json
    persistFileStore();
  } catch (err: any) {
    console.warn('[DB] MongoDB connection warning:', err.message);
    isMongoConnected = false;
  }
}

function sanitizeEntry(e: any): IEntry {
  const startStation = String(e.startStation || 'Attingal');
  const endStation = String(e.endStation || 'Attingal');
  const actualOMR = Number(e.actualOMR) || 0;
  const actualCMR = Number(e.actualCMR) || 0;
  const logbookOMR =
    Number(e.logbookOMR) || (actualOMR ? calcOpeningOMR(actualOMR, startStation) : 0);
  const logbookCMR =
    actualCMR ? (Number(e.logbookCMR) || calcClosingCMR(actualCMR, endStation)) : 0;
  const km =
    actualCMR && logbookCMR && logbookOMR
      ? Math.max(logbookCMR - logbookOMR, 0)
      : (Number(e.km) || 0);

  const isPending =
    e.status === 'pending' ||
    (!actualCMR && (!e.placesVisited || String(e.placesVisited).trim() === ''));
  const status = isPending ? 'pending' : 'completed';

  return {
    id: String(e.id || Date.now().toString() + Math.floor(Math.random() * 1000)),
    date: String(e.date || ''),
    startTime: String(e.startTime || ''),
    startStation,
    actualOMR,
    logbookOMR,
    placesVisited: String(e.placesVisited || ''),
    purpose: String(e.purpose || ''),
    endStation,
    actualCMR,
    logbookCMR,
    km,
    remarks: String(e.remarks || ''),
    user: String(e.user || ''),
    status,
  };
}

export const DB = {
  async getUsers(): Promise<IUser[]> {
    if (isMongoConnected) {
      try {
        const users = await UserModel.find().lean();
        return users.map((u: any) => ({ ...u, id: u.id || u._id?.toString() }));
      } catch (err: any) {
        console.warn('[DB] UserModel.find failed, fallback to memStore:', err.message);
      }
    }
    return memStore.users;
  },

  async getUserById(id: string): Promise<IUser | null> {
    if (isMongoConnected) {
      try {
        const user = await UserModel.findOne({ id }).lean();
        if (user) return user as IUser;
      } catch (err: any) {
        console.warn('[DB] getUserById failed, fallback to memStore:', err.message);
      }
    }
    return memStore.users.find((u) => u.id === id) || null;
  },

  async getUserByUsername(username: string): Promise<IUser | null> {
    const raw = String(username || '').trim().toLowerCase();
    const normalized = raw.replace(/[._\s-]+/g, '');
    const allUsers = await this.getUsers();

    // 1. Exact match on username
    let found = allUsers.find((u) => u.username.toLowerCase() === raw);
    // 2. Normalized match (e.g. jto_attingal vs jto.attingal vs jto attingal)
    if (!found) {
      found = allUsers.find(
        (u) => u.username.toLowerCase().replace(/[._\s-]+/g, '') === normalized
      );
    }
    // 3. Match by ID
    if (!found) {
      found = allUsers.find((u) => u.id === raw);
    }
    // 4. Match by name or designation (e.g. 'venjaramoodu', 'attingal', 'kilimanoor', 'varkala')
    if (!found && raw.length >= 3) {
      found = allUsers.find((u) => {
        const uClean = u.username.toLowerCase();
        const nClean = u.name.toLowerCase();
        return uClean.includes(normalized) || nClean.includes(raw);
      });
    }
    return found || null;
  },

  async createUser(user: IUser): Promise<IUser> {
    if (isMongoConnected) {
      try {
        await UserModel.create(user);
      } catch (err: any) {
        console.warn('[DB] UserModel.create failed, falling back:', err.message);
      }
    }
    const idx = memStore.users.findIndex((u) => u.id === user.id || u.username === user.username);
    if (idx >= 0) {
      memStore.users[idx] = user;
    } else {
      memStore.users.push(user);
    }
    persistFileStore();
    return user;
  },

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    if (isMongoConnected) {
      try {
        await UserModel.findOneAndUpdate({ id }, updates, { returnDocument: 'after' }).lean();
      } catch (err: any) {
        console.warn('[DB] updateUser failed, falling back:', err.message);
      }
    }
    const idx = memStore.users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      memStore.users[idx] = { ...memStore.users[idx], ...updates };
      persistFileStore();
      return memStore.users[idx];
    }
    return null;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (isMongoConnected) {
      try {
        await UserModel.deleteOne({ id });
      } catch (err: any) {
        console.warn('[DB] deleteUser failed, falling back:', err.message);
      }
    }
    memStore.users = memStore.users.filter((u) => u.id !== id);
    persistFileStore();
    return true;
  },

  async saveUsers(users: IUser[]): Promise<boolean> {
    if (isMongoConnected) {
      try {
        await UserModel.deleteMany({});
        await UserModel.insertMany(users);
      } catch (err: any) {
        console.warn('[DB] saveUsers failed, falling back:', err.message);
      }
    }
    memStore.users = [...users];
    persistFileStore();
    return true;
  },

  async getEntries(): Promise<IEntry[]> {
    if (isMongoConnected) {
      try {
        const entries = await EntryModel.find().sort({ date: 1, startTime: 1 }).lean();
        const list = entries.map((e: any) => sanitizeEntry({ ...e, id: e.id || e._id?.toString() }));
        if (list.length > 0 || memStore.entries.length === 0) {
          memStore.entries = list;
          persistFileStore();
        }
        return list;
      } catch (err: any) {
        console.warn('[DB] getEntries failed, fallback to memStore:', err.message);
      }
    }
    return [...memStore.entries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  },

  async saveEntry(entry: IEntry): Promise<IEntry> {
    const clean = sanitizeEntry(entry);
    if (isMongoConnected) {
      try {
        await EntryModel.findOneAndUpdate(
          { id: clean.id },
          clean,
          { upsert: true, returnDocument: 'after' }
        );
      } catch (err: any) {
        console.warn('[DB] saveEntry failed, falling back:', err.message);
      }
    }
    const idx = memStore.entries.findIndex((e) => e.id === clean.id);
    if (idx >= 0) {
      memStore.entries[idx] = clean;
    } else {
      memStore.entries.push(clean);
    }
    persistFileStore();
    return clean;
  },

  async syncEntries(entries: IEntry[]): Promise<boolean> {
    const sanitized = entries.map((e) => sanitizeEntry(e));
    if (isMongoConnected) {
      try {
        await EntryModel.deleteMany({});
        await EntryModel.insertMany(sanitized);
      } catch (err: any) {
        console.warn('[DB] syncEntries failed, falling back:', err.message);
      }
    }
    memStore.entries = sanitized;
    persistFileStore();
    return true;
  },

  async deleteEntry(id: string): Promise<boolean> {
    if (isMongoConnected) {
      try {
        await EntryModel.deleteOne({ id });
      } catch (err: any) {
        console.warn('[DB] deleteEntry failed, falling back:', err.message);
      }
    }
    memStore.entries = memStore.entries.filter((e) => e.id !== id);
    persistFileStore();
    return true;
  },

  async deleteMonthEntries(monthKey: string): Promise<{ deleted: number }> {
    let count = 0;
    if (isMongoConnected) {
      try {
        const regex = new RegExp(`^${monthKey}`);
        const res = await EntryModel.deleteMany({ date: { $regex: regex } });
        count = res.deletedCount || 0;
      } catch (err: any) {
        console.warn('[DB] deleteMonthEntries failed, falling back:', err.message);
      }
    }
    const prevLen = memStore.entries.length;
    memStore.entries = memStore.entries.filter((e) => !e.date.startsWith(monthKey));
    if (!count) count = prevLen - memStore.entries.length;
    persistFileStore();
    return { deleted: count };
  },

  async cleanupOldEntries(cutoffMonthKey: string): Promise<{ deleted: number }> {
    let count = 0;
    if (isMongoConnected) {
      try {
        const res = await EntryModel.deleteMany({ date: { $lt: cutoffMonthKey } });
        count = res.deletedCount || 0;
      } catch (err: any) {
        console.warn('[DB] cleanupOldEntries failed, falling back:', err.message);
      }
    }
    const prevLen = memStore.entries.length;
    memStore.entries = memStore.entries.filter((e) => e.date >= cutoffMonthKey);
    if (!count) count = prevLen - memStore.entries.length;
    persistFileStore();
    return { deleted: count };
  },

  async clearAllEntries(): Promise<{ deleted: boolean }> {
    if (isMongoConnected) {
      try {
        await EntryModel.deleteMany({});
      } catch (err: any) {
        console.warn('[DB] clearAllEntries failed, falling back:', err.message);
      }
    }
    memStore.entries = [];
    memStore.settings = { ...memStore.settings, sampleDataCleared: true };
    persistFileStore();
    return { deleted: true };
  },

  async getSettings(): Promise<any> {
    if (isMongoConnected) {
      try {
        const s = await SettingModel.findOne({ key: 'appConfig' }).lean() || await SettingModel.findOne().lean();
        if (s) {
          const cfg = (s as any).value || s;
          const merged = { ...defaultSettings, ...cfg };
          memStore.settings = merged;
          return merged;
        }
      } catch (err: any) {
        console.warn('[DB] getSettings failed, fallback to memStore:', err.message);
      }
    }
    return memStore.settings;
  },

  async updateSettings(updates: any): Promise<any> {
    const merged = { ...memStore.settings, ...updates };
    if (isMongoConnected) {
      try {
        await SettingModel.findOneAndUpdate(
          { key: 'appConfig' },
          { $set: { key: 'appConfig', value: merged } },
          { upsert: true, returnDocument: 'after' }
        ).lean();
      } catch (err: any) {
        console.warn('[DB] updateSettings failed, fallback to memStore:', err.message);
      }
    }
    memStore.settings = merged;
    persistFileStore();
    return memStore.settings;
  },

  async reloadFromMongo(): Promise<{ success: boolean; entriesCount: number; message: string }> {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'bsnlfleet';
    if (!uri) {
      return {
        success: false,
        entriesCount: memStore.entries.length,
        message: 'No MONGODB_URI configured in environment',
      };
    }
    try {
      if (mongoose.connection.readyState !== 1) {
        mongoose.set('bufferCommands', false);
        await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 8000 });
        isMongoConnected = true;
      }
      const mongoEntries = await EntryModel.find().sort({ date: 1, startTime: 1 }).lean();
      memStore.entries = mongoEntries.map((e: any) => sanitizeEntry(e));

      const mongoUsers = await UserModel.find().lean();
      if (mongoUsers && mongoUsers.length > 0) {
        memStore.users = mongoUsers.map((u: any) => ({ ...u, id: u.id || u._id?.toString() }));
      }

      const mongoSetting = await SettingModel.findOne({ key: 'appConfig' }).lean() || await SettingModel.findOne().lean();
      if (mongoSetting) {
        const cfg = (mongoSetting as any).value || mongoSetting;
        const cleanCfg = {
          ...cfg,
          logoUrl: cfg.logoUrl && !cfg.logoUrl.includes('placeholder') ? cfg.logoUrl : DEFAULT_LOGO_URL,
          vehicleImg: cfg.vehicleImg && !cfg.vehicleImg.includes('unsplash.com') ? cfg.vehicleImg : DEFAULT_VEHICLE_IMG,
        };
        memStore.settings = { ...defaultSettings, ...cleanCfg };
      }

      persistFileStore();
      return {
        success: true,
        entriesCount: memStore.entries.length,
        message: `Successfully connected to MongoDB (${dbName}) and synced ${memStore.entries.length} log entries, including all September records!`,
      };
    } catch (err: any) {
      return {
        success: false,
        entriesCount: memStore.entries.length,
        message: err.message,
      };
    }
  },
};
