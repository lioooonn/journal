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
        activity_other TEXT,
        sugar_consumed REAL,
        snacks_count INTEGER,
        sleep_time TEXT,
        wake_time TEXT,
        studying_done INTEGER DEFAULT 0,
        studying_length TEXT,
        social_media_time TEXT,
        water_bottle_twice INTEGER DEFAULT 0,
        work_done INTEGER DEFAULT 0,
        volunteer_done INTEGER DEFAULT 0,
        volunteer_hours REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
      // Add new columns for existing databases; errors are ignored if they already exist
      const alterStatements = [
        'ALTER TABLE entries ADD COLUMN activity_other TEXT',
        'ALTER TABLE entries ADD COLUMN work_done INTEGER DEFAULT 0',
        'ALTER TABLE entries ADD COLUMN volunteer_done INTEGER DEFAULT 0',
        'ALTER TABLE entries ADD COLUMN volunteer_hours REAL DEFAULT 0'
      ];
      alterStatements.forEach(stmt => {
        db.run(stmt, () => {});
      });
    });
  });
}

function insertEntry(entry) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    const sql = `INSERT INTO entries (
      date, activity_type, activity_amount, activity_other, sugar_consumed, snacks_count,
      sleep_time, wake_time, studying_done, studying_length,
      social_media_time, water_bottle_twice, work_done, volunteer_done, volunteer_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
      entry.date,
      entry.activity_type || null,
      entry.activity_amount || null,
      entry.activity_other || null,
      entry.sugar_consumed || 0,
      entry.snacks_count || 0,
      entry.sleep_time || null,
      entry.wake_time || null,
      entry.studying_done ? 1 : 0,
      entry.studying_length || null,
      entry.social_media_time || null,
      entry.water_bottle_twice ? 1 : 0,
      entry.work_done ? 1 : 0,
      entry.volunteer_done ? 1 : 0,
      entry.volunteer_hours || 0
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
          water_bottle_twice: row.water_bottle_twice === 1,
          work_done: row.work_done === 1,
          volunteer_done: row.volunteer_done === 1,
          volunteer_hours: row.volunteer_hours || 0
        })));
      }
      db.close();
    });
  });
}

function updateEntry(id, entry) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    const sql = `UPDATE entries SET
      date = ?, activity_type = ?, activity_amount = ?, activity_other = ?,
      sugar_consumed = ?, snacks_count = ?, sleep_time = ?, wake_time = ?,
      studying_done = ?, studying_length = ?, social_media_time = ?,
      water_bottle_twice = ?, work_done = ?, volunteer_done = ?, volunteer_hours = ?
      WHERE id = ?`;
    const params = [
      entry.date,
      entry.activity_type || null,
      entry.activity_amount || null,
      entry.activity_other || null,
      entry.sugar_consumed || 0,
      entry.snacks_count || 0,
      entry.sleep_time || null,
      entry.wake_time || null,
      entry.studying_done ? 1 : 0,
      entry.studying_length || null,
      entry.social_media_time || null,
      entry.water_bottle_twice ? 1 : 0,
      entry.work_done ? 1 : 0,
      entry.volunteer_done ? 1 : 0,
      entry.volunteer_hours || 0,
      id
    ];
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
      db.close();
    });
  });
}

function deleteEntry(id) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run('DELETE FROM entries WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
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
      // Work days and earnings
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as count FROM entries WHERE work_done = 1', (err, row) => {
          if (err) rej(err);
          else res(row.count);
        });
      }),
      // Volunteer totals
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as days, SUM(volunteer_hours) as hours FROM entries WHERE volunteer_done = 1', (err, row) => {
          if (err) rej(err);
          else res({ days: row.days || 0, hours: row.hours || 0 });
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
    ]).then(([totalEntries, activityStats, avgSugar, avgSnacks, studyingDays, waterDays, workDays, volunteerTotals, avgSleep]) => {
      resolve({
        totalEntries,
        activityStats,
        avgSugar: Math.round(avgSugar * 100) / 100,
        avgSnacks: Math.round(avgSnacks * 100) / 100,
        studyingDays,
        waterDays,
        workDays,
        totalEarnings: workDays * 45,
        volunteerDays: volunteerTotals.days,
        volunteerHours: Math.round(volunteerTotals.hours * 100) / 100,
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

module.exports = { initDatabase, insertEntry, getAllEntries, updateEntry, deleteEntry, getStatistics };
