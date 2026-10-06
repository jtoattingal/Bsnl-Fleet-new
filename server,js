import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB കണക്ഷൻ
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Warning: MONGODB_URI environment variable is missing!");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// ഡാറ്റാ മോഡൽ (Schema) - നിങ്ങളുടെ ആവശ്യത്തിനനുസരിച്ച് ഫീൽഡുകൾ ഇവിടെ വരും
const LogSchema = new mongoose.Schema({
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', LogSchema);

// API Endpoints
// 1. ലോഗുകൾ സേവ് ചെയ്യാൻ (POST)
app.post('/api/logs', async (req, res) => {
  try {
    const newLog = new Log({ data: req.body });
    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. സേവ് ചെയ്ത ലോഗുകൾ തിരികെ എടുക്കാൻ (GET)
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// React ഫ്രണ്ട്-എൻഡ് സ്റ്റാറ്റിക് ഫയലുകൾ സെർവ് ചെയ്യാൻ
app.use(express.static(path.join(__dirname, 'dist')));

// ബാക്കി എല്ലാ റൂട്ടുകൾക്കും React-ന്റെ index.html നൽകുക
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
