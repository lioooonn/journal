const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const { initDatabase, insertEntry, getAllEntries, updateEntry, deleteEntry, getStatistics } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = crypto.createHmac('sha256', ADMIN_PASSWORD).update('journal-admin').digest('hex');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database
initDatabase().catch(console.error);

// Simple admin auth middleware
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Auth route
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  res.json({ token: ADMIN_TOKEN });
});

// API Routes
app.post('/api/entries', requireAdmin, async (req, res) => {
  try {
    const entry = req.body;
    
    // Validate required fields
    if (!entry.date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const result = await insertEntry(entry);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error inserting entry:', error);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

app.put('/api/entries/:id', requireAdmin, async (req, res) => {
  try {
    const entry = req.body;
    if (!entry.date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    const result = await updateEntry(req.params.id, entry);
    res.json({ updated: result.changes });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.delete('/api/entries/:id', requireAdmin, async (req, res) => {
  try {
    const result = await deleteEntry(req.params.id);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await getAllEntries();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/progress', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'progress.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
