const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

async function initDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      activity_type TEXT,
      activity_amount TEXT,
      activity_other TEXT,
      sugar_consumed REAL DEFAULT 0,
      snacks_count INTEGER DEFAULT 0,
      sleep_time TEXT,
      wake_time TEXT,
      studying_done BOOLEAN DEFAULT false,
      studying_length TEXT,
      social_media_time TEXT,
      water_bottle_twice BOOLEAN DEFAULT false,
      work_done BOOLEAN DEFAULT false,
      volunteer_done BOOLEAN DEFAULT false,
      volunteer_hours REAL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(createTableSQL);
  console.log('Connected to PostgreSQL and ensured schema exists');
}

async function insertEntry(entry) {
  const sql = `
    INSERT INTO entries (
      date, activity_type, activity_amount, activity_other, sugar_consumed, snacks_count,
      sleep_time, wake_time, studying_done, studying_length,
      social_media_time, water_bottle_twice, work_done, volunteer_done, volunteer_hours
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id;
  `;
  const params = [
    entry.date,
    entry.activity_type || null,
    entry.activity_amount || null,
    entry.activity_other || null,
    entry.sugar_consumed || 0,
    entry.snacks_count || 0,
    entry.sleep_time || null,
    entry.wake_time || null,
    !!entry.studying_done,
    entry.studying_length || null,
    entry.social_media_time || null,
    !!entry.water_bottle_twice,
    !!entry.work_done,
    !!entry.volunteer_done,
    entry.volunteer_hours || 0
  ];
  const result = await pool.query(sql, params);
  return { id: result.rows[0].id, ...entry };
}

async function getAllEntries() {
  const result = await pool.query('SELECT * FROM entries ORDER BY date DESC, created_at DESC');
  return result.rows.map(row => ({
    ...row,
    studying_done: row.studying_done === true,
    water_bottle_twice: row.water_bottle_twice === true,
    work_done: row.work_done === true,
    volunteer_done: row.volunteer_done === true,
    volunteer_hours: row.volunteer_hours || 0
  }));
}

async function updateEntry(id, entry) {
  const sql = `
    UPDATE entries SET
      date = $1,
      activity_type = $2,
      activity_amount = $3,
      activity_other = $4,
      sugar_consumed = $5,
      snacks_count = $6,
      sleep_time = $7,
      wake_time = $8,
      studying_done = $9,
      studying_length = $10,
      social_media_time = $11,
      water_bottle_twice = $12,
      work_done = $13,
      volunteer_done = $14,
      volunteer_hours = $15
    WHERE id = $16;
  `;
  const params = [
    entry.date,
    entry.activity_type || null,
    entry.activity_amount || null,
    entry.activity_other || null,
    entry.sugar_consumed || 0,
    entry.snacks_count || 0,
    entry.sleep_time || null,
    entry.wake_time || null,
    !!entry.studying_done,
    entry.studying_length || null,
    entry.social_media_time || null,
    !!entry.water_bottle_twice,
    !!entry.work_done,
    !!entry.volunteer_done,
    entry.volunteer_hours || 0,
    id
  ];
  const result = await pool.query(sql, params);
  return { changes: result.rowCount };
}

async function deleteEntry(id) {
  const result = await pool.query('DELETE FROM entries WHERE id = $1', [id]);
  return { changes: result.rowCount };
}

async function getStatistics() {
  const [
    totalEntriesRes,
    activityStatsRes,
    avgSugarRes,
    avgSnacksRes,
    studyingDaysRes,
    waterDaysRes,
    workDaysRes,
    volunteerTotalsRes,
    sleepRowsRes
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM entries'),
    pool.query(`
      SELECT activity_type, COUNT(*)::int AS count
      FROM entries
      WHERE activity_type IS NOT NULL
      GROUP BY activity_type
    `),
    pool.query('SELECT AVG(sugar_consumed)::float AS avg FROM entries WHERE sugar_consumed > 0'),
    pool.query('SELECT AVG(snacks_count)::float AS avg FROM entries WHERE snacks_count > 0'),
    pool.query('SELECT COUNT(*)::int AS count FROM entries WHERE studying_done = true'),
    pool.query('SELECT COUNT(*)::int AS count FROM entries WHERE water_bottle_twice = true'),
    pool.query('SELECT COUNT(*)::int AS count FROM entries WHERE work_done = true'),
    pool.query('SELECT COUNT(*)::int AS days, COALESCE(SUM(volunteer_hours),0)::float AS hours FROM entries WHERE volunteer_done = true'),
    pool.query('SELECT sleep_time, wake_time FROM entries WHERE sleep_time IS NOT NULL AND wake_time IS NOT NULL')
  ]);

  const totalEntries = totalEntriesRes.rows[0].count || 0;
  const activityStats = activityStatsRes.rows;
  const avgSugar = parseFloat(avgSugarRes.rows[0].avg) || 0;
  const avgSnacks = parseFloat(avgSnacksRes.rows[0].avg) || 0;
  const studyingDays = studyingDaysRes.rows[0].count || 0;
  const waterDays = waterDaysRes.rows[0].count || 0;
  const workDays = workDaysRes.rows[0].count || 0;
  const volunteerDays = volunteerTotalsRes.rows[0].days || 0;
  const volunteerHours = parseFloat(volunteerTotalsRes.rows[0].hours) || 0;

  const durations = sleepRowsRes.rows
    .map(row => {
      const sleep = parseTime(row.sleep_time);
      const wake = parseTime(row.wake_time);
      if (sleep != null && wake != null) {
        let diff = wake - sleep;
        if (diff < 0) diff += 24;
        return diff;
      }
      return null;
    })
    .filter(d => d != null);

  const avgSleep = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return {
    totalEntries,
    activityStats,
    avgSugar: Math.round(avgSugar * 100) / 100,
    avgSnacks: Math.round(avgSnacks * 100) / 100,
    studyingDays,
    waterDays,
    workDays,
    totalEarnings: workDays * 45,
    volunteerDays,
    volunteerHours: Math.round(volunteerHours * 100) / 100,
    avgSleep: Math.round(avgSleep * 100) / 100
  };
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
  }
  return null;
}

module.exports = { initDatabase, insertEntry, getAllEntries, updateEntry, deleteEntry, getStatistics };
