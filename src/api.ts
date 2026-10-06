import { AppSettings, LogEntry, User } from './types';

const API_BASE = '/api';

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2, delay = 350): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

async function parseJsonResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || fallbackError);
    }
    return data;
  }
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }
  throw new Error(fallbackError);
}

export const api = {
  async getEntries(): Promise<LogEntry[]> {
    const res = await fetchWithRetry(`${API_BASE}/entries`);
    return parseJsonResponse<LogEntry[]>(res, 'Failed to fetch entries');
  },

  async saveEntry(entry: LogEntry): Promise<LogEntry> {
    const isUpdate = Boolean(entry.id);
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `${API_BASE}/entries/${entry.id}` : `${API_BASE}/entries`;
    const res = await fetchWithRetry(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return parseJsonResponse<LogEntry>(res, 'Failed to save entry');
  },

  async deleteEntry(id: string): Promise<boolean> {
    const res = await fetchWithRetry(`${API_BASE}/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      await parseJsonResponse(res, 'Failed to delete entry');
    }
    return true;
  },

  async syncEntries(entries: LogEntry[]): Promise<boolean> {
    const res = await fetchWithRetry(`${API_BASE}/entries/sync`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    await parseJsonResponse(res, 'Failed to sync entries to database');
    return true;
  },

  async deleteMonthEntries(monthKey: string): Promise<{ deleted: number }> {
    const res = await fetchWithRetry(`${API_BASE}/entries/month`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthKey }),
    });
    return parseJsonResponse<{ deleted: number }>(res, 'Failed to purge month entries from database');
  },

  async cleanupOldEntries(cutoffMonthKey: string): Promise<{ deleted: number }> {
    const res = await fetchWithRetry(`${API_BASE}/entries/cleanup-older`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cutoffMonthKey }),
    });
    return parseJsonResponse<{ deleted: number }>(res, 'Failed to clean up old entries');
  },

  async clearAllEntries(): Promise<{ deleted: number }> {
    const res = await fetchWithRetry(`${API_BASE}/entries/clear-all`, {
      method: 'DELETE',
    });
    return parseJsonResponse<{ deleted: number }>(res, 'Failed to clear entries');
  },

  async getUsers(): Promise<User[]> {
    const res = await fetchWithRetry(`${API_BASE}/users`);
    return parseJsonResponse<User[]>(res, 'Failed to fetch users');
  },

  async createUser(userData: {
    username: string;
    name: string;
    designation: string;
    password?: string;
  }): Promise<User> {
    const res = await fetchWithRetry(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return parseJsonResponse<User>(res, 'Failed to create user');
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetchWithRetry(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return parseJsonResponse<User>(res, 'Failed to update user');
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetchWithRetry(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      await parseJsonResponse(res, 'Failed to delete user');
    }
    return true;
  },

  async resetUserPassword(id: string): Promise<User> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await parseJsonResponse(res, 'Reset failed');
      return data.user || data;
    } catch {
      // fallback to updateUser with 'Bsnl'
      return this.updateUser(id, { password: 'Bsnl' });
    }
  },

  async saveUsers(users: User[]): Promise<boolean> {
    const res = await fetchWithRetry(`${API_BASE}/users/sync`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
    await parseJsonResponse(res, 'Failed to sync users to database');
    return true;
  },

  async getSettings(): Promise<AppSettings> {
    const res = await fetchWithRetry(`${API_BASE}/settings`);
    return parseJsonResponse<AppSettings>(res, 'Failed to fetch settings');
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetchWithRetry(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return parseJsonResponse<AppSettings>(res, 'Failed to update settings');
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return this.updateSettings(settings);
  },

  async login(credentials: {
    username?: string;
    password?: string;
    type: 'user' | 'admin';
  }): Promise<{ success: boolean; user?: User; isAdmin?: boolean; message?: string }> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await parseJsonResponse(res, 'Login failed');
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed' };
    }
  },

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    const res = await fetchWithRetry(`${API_BASE}/auth/user-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
    return parseJsonResponse(res, 'Failed to update password');
  },

  async syncFromMongo(): Promise<{ success: boolean; entriesCount: number; message: string }> {
    try {
      const res = await fetchWithRetry(`${API_BASE}/sync-mongo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, 2, 400);
      return await parseJsonResponse(res, 'Failed to sync from MongoDB');
    } catch (err: any) {
      return {
        success: false,
        entriesCount: 0,
        message: err.message || 'Database server is currently connecting; please retry in a moment.',
      };
    }
  },
};
