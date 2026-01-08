const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase, insertEntry, getAllEntries, getStatistics } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database
initDatabase().catch(console.error);

// API Routes
app.post('/api/entries', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
