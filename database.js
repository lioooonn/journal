const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'journal.db');

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        activity_type TEXT,
        activity_amount TEXT,
        sugar_consumed REAL,
        snacks_count INTEGER,
        sleep_time TEXT,
        wake_time TEXT,
        studying_done INTEGER DEFAULT 0,
        studying_length TEXT,
        social_media_time TEXT,
        water_bottle_twice INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  });
}

function insertEntry(entry) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    const sql = `INSERT INTO entries (
      date, activity_type, activity_amount, sugar_consumed, snacks_count,
      sleep_time, wake_time, studying_done, studying_length,
      social_media_time, water_bottle_twice
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
      entry.date,
      entry.activity_type || null,
      entry.activity_amount || null,
      entry.sugar_consumed || 0,
      entry.snacks_count || 0,
      entry.sleep_time || null,
      entry.wake_time || null,
      entry.studying_done ? 1 : 0,
      entry.studying_length || null,
      entry.social_media_time || null,
      entry.water_bottle_twice ? 1 : 0
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...entry });
      }
      db.close();
    });
  });
}

function getAllEntries() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all('SELECT * FROM entries ORDER BY date DESC, created_at DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => ({
          ...row,
          studying_done: row.studying_done === 1,
          water_bottle_twice: row.water_bottle_twice === 1
        })));
      }
      db.close();
    });
  });
}

function getStatistics() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    Promise.all([
      // Total entries
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as count FROM entries', (err, row) => {
          if (err) rej(err);
          else res(row.count);
        });
      }),
      // Activity stats
      new Promise((res, rej) => {
        db.all(`SELECT activity_type, COUNT(*) as count 
                FROM entries 
                WHERE activity_type IS NOT NULL 
                GROUP BY activity_type`, (err, rows) => {
          if (err) rej(err);
          else res(rows);
        });
      }),
      // Average sugar
      new Promise((res, rej) => {
        db.get('SELECT AVG(sugar_consumed) as avg FROM entries WHERE sugar_consumed > 0', (err, row) => {
          if (err) rej(err);
          else res(row.avg || 0);
        });
      }),
      // Average snacks
      new Promise((res, rej) => {
        db.get('SELECT AVG(snacks_count) as avg FROM entries WHERE snacks_count > 0', (err, row) => {
          if (err) rej(err);
          else res(row.avg || 0);
        });
      }),
      // Studying days
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as count FROM entries WHERE studying_done = 1', (err, row) => {
          if (err) rej(err);
          else res(row.count);
        });
      }),
      // Water bottle days
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as count FROM entries WHERE water_bottle_twice = 1', (err, row) => {
          if (err) rej(err);
          else res(row.count);
        });
      }),
      // Average sleep duration (if we have both sleep and wake times)
      new Promise((res, rej) => {
        db.all(`SELECT sleep_time, wake_time FROM entries 
                WHERE sleep_time IS NOT NULL AND wake_time IS NOT NULL`, (err, rows) => {
          if (err) rej(err);
          else {
            const durations = rows.map(row => {
              const sleep = parseTime(row.sleep_time);
              const wake = parseTime(row.wake_time);
              if (sleep && wake) {
                let diff = wake - sleep;
                if (diff < 0) diff += 24; // Handle overnight
                return diff;
              }
              return null;
            }).filter(d => d !== null);
            const avg = durations.length > 0 
              ? durations.reduce((a, b) => a + b, 0) / durations.length 
              : 0;
            res(avg);
          }
        });
      })
    ]).then(([totalEntries, activityStats, avgSugar, avgSnacks, studyingDays, waterDays, avgSleep]) => {
      resolve({
        totalEntries,
        activityStats,
        avgSugar: Math.round(avgSugar * 100) / 100,
        avgSnacks: Math.round(avgSnacks * 100) / 100,
        studyingDays,
        waterDays,
        avgSleep: Math.round(avgSleep * 100) / 100
      });
      db.close();
    }).catch(reject);
  });
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1]) + parseInt(match[2]) / 60;
  }
  return null;
}

module.exports = { initDatabase, insertEntry, getAllEntries, getStatistics };
