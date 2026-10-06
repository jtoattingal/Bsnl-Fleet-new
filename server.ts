import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { DB, initDatabase } from './server/db';

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, type } = req.body;
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();

    if (type === 'admin') {
      const settings = await DB.getSettings();
      const adminPass = String(settings.adminPassword || 'Bsnlatt').trim().toLowerCase();
      if (cleanPassword.toLowerCase() === adminPass) {
        return res.json({
          success: true,
          isAdmin: true,
          user: {
            id: 'admin',
            username: 'admin',
            name: 'Administrator',
            designation: 'System Admin',
            active: true,
          },
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid admin password. Default is Bsnlatt.' });
    }

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Please enter both username and password' });
    }

    const user = await DB.getUserByUsername(cleanUsername);
    if (!user) {
      return res.status(401).json({ success: false, message: `Officer account "${cleanUsername}" not found. Please select from the dropdown or verify spelling.` });
    }
    if (!user.active) {
      return res.status(403).json({ success: false, message: 'This officer account is inactive.' });
    }

    const userPass = String(user.password || 'Bsnl').trim().toLowerCase();
    if (userPass === cleanPassword.toLowerCase()) {
      return res.json({
        success: true,
        isAdmin: false,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          designation: user.designation,
          active: user.active,
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Incorrect password. Default officer password is Bsnl.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/user-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const user = await DB.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const userPass = String(user.password || 'Bsnl').trim().toLowerCase();
    const cleanCurrent = String(currentPassword || '').trim().toLowerCase();
    if (userPass !== cleanCurrent) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    const updated = await DB.updateUser(userId, { password: String(newPassword).trim() });
    return res.json({ success: true, message: 'Password updated successfully', user: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Entries API
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await DB.getEntries();
    res.json(entries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const entryData = req.body;
    if (!entryData.id) entryData.id = Date.now().toString();
    const saved = await DB.saveEntry(entryData);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entries/sync', async (req, res) => {
  try {
    const entries = req.body.entries || [];
    await DB.syncEntries(entries);
    res.json({ success: true, count: entries.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const saved = await DB.saveEntry({ ...req.body, id: req.params.id });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/clear-all', async (req, res) => {
  try {
    const result = await DB.clearAllEntries();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/cleanup-older', async (req, res) => {
  try {
    const cutoffMonthKey = req.body.cutoffMonthKey || '';
    const result = await DB.cleanupOldEntries(cutoffMonthKey);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/month', async (req, res) => {
  try {
    const monthKey = req.body.monthKey;
    const result = await DB.deleteMonthEntries(monthKey);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/month/:monthKey', async (req, res) => {
  try {
    const result = await DB.deleteMonthEntries(req.params.monthKey);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await DB.deleteEntry(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await DB.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MongoDB Atlas live sync endpoint
app.post('/api/sync-mongo', async (req, res) => {
  try {
    const result = await DB.reloadFromMongo();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/sync-mongo', async (req, res) => {
  try {
    const result = await DB.reloadFromMongo();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updated = await DB.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const users = await DB.getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const saved = await DB.createUser({
      id: Date.now().toString(),
      ...req.body,
      password: req.body.password || 'Bsnl',
      active: true,
    });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/sync', async (req, res) => {
  try {
    const users = req.body.users || [];
    await DB.saveUsers(users);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updated = await DB.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await DB.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const updated = await DB.updateUser(req.params.id, { password: 'Bsnl' });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'Password reset to Bsnl', user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server Initialization and Static/Vite Setup
async function startServer() {
  await initDatabase().catch((err) => console.warn('[DB] Init warning:', err.message));

  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(clientDistPath)) {
      app.use(express.static(clientDistPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();

export default app;
