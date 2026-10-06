import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI is not set in Environment Variables!');
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch((err) => console.error('MongoDB Atlas Connection Error:', err));
}

// 2. Mongoose Models (Flexible Schemas)
const EntrySchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });
const SettingSchema = new mongoose.Schema({}, { strict: false });

const Entry = mongoose.model('Entry', EntrySchema);
const UserModel = mongoose.model('User', UserSchema);
const Setting = mongoose.model('Setting', SettingSchema);

// 3. API Routes for Entries (/api/entries)
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().lean();
    res.json(entries.map((e) => ({ ...e, id: e.id || e._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const data = req.body;
    const newEntry = new Entry(data);
    await newEntry.save();
    const result = newEntry.toObject();
    result.id = result.id || result._id.toString();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Entry.findOneAndUpdate(
      { $or: [{ id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
      { $set: req.body },
      { new: true, upsert: true }
    ).lean();
    res.json({ ...updated, id: updated.id || updated._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Entry.deleteOne({
      $or: [{ id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entries/sync', async (req, res) => {
  try {
    const { entries } = req.body;
    if (Array.isArray(entries)) {
      for (const item of entries) {
        const itemId = item.id;
        await Entry.findOneAndUpdate(
          { $or: [{ id: itemId }, { _id: mongoose.isValidObjectId(itemId) ? itemId : null }] },
          { $set: item },
          { upsert: true }
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/clear-all', async (req, res) => {
  try {
    const result = await Entry.deleteMany({});
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. API Routes for Users (/api/users)
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserModel.find().lean();
    res.json(users.map((u) => ({ ...u, id: u.id || u._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = new UserModel(req.body);
    await newUser.save();
    const result = newUser.toObject();
    result.id = result.id || result._id.toString();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/sync', async (req, res) => {
  try {
    const { users } = req.body;
    if (Array.isArray(users)) {
      for (const u of users) {
        await UserModel.findOneAndUpdate(
          { username: u.username },
          { $set: u },
          { upsert: true }
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. API Routes for Settings (/api/settings)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Setting.findOne().lean();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updated = await Setting.findOneAndUpdate(
      {},
      { $set: req.body },
      { upsert: true, new: true }
    ).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Serve React Production Build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
