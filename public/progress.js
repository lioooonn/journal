document.addEventListener('DOMContentLoaded', () => {
  loadStatistics();
  loadEntries();
});

async function loadStatistics() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    displayStatistics(stats);
  } catch (error) {
    console.error('Error loading statistics:', error);
    document.getElementById('loading').textContent = 'Failed to load statistics';
  }
}

async function loadEntries() {
  try {
    const response = await fetch('/api/entries');
    const entries = await response.json();
    displayEntries(entries);
  } catch (error) {
    console.error('Error loading entries:', error);
  }
}

function displayStatistics(stats) {
  const statsGrid = document.getElementById('stats-grid');
  const activityChart = document.getElementById('activity-chart');
  
  // Overall stats
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalEntries}</div>
      <div class="stat-label">Total Entries</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.studyingDays}</div>
      <div class="stat-label">Study Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.waterDays}</div>
      <div class="stat-label">Water Goal Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avgSugar}g</div>
      <div class="stat-label">Avg Sugar/Day</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avgSnacks}</div>
      <div class="stat-label">Avg Snacks/Day</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avgSleep.toFixed(1)}h</div>
      <div class="stat-label">Avg Sleep</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.workDays}</div>
      <div class="stat-label">Work Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">$${stats.totalEarnings}</div>
      <div class="stat-label">Total Earned</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.volunteerDays}</div>
      <div class="stat-label">Volunteer Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.volunteerHours}</div>
      <div class="stat-label">Volunteer Hours</div>
    </div>
  `;

  // Activity chart
  if (stats.activityStats && stats.activityStats.length > 0) {
    const maxCount = Math.max(...stats.activityStats.map(a => a.count));
    activityChart.innerHTML = stats.activityStats.map(activity => {
      const percentage = (activity.count / maxCount) * 100;
      return `
        <div class="activity-item">
          <span><strong>${activity.activity_type}</strong></span>
          <div style="flex: 1; display: flex; align-items: center; margin: 0 15px;">
            <div class="activity-bar" style="width: ${percentage}%">
              ${activity.count}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    activityChart.innerHTML = '<p style="color: #666; text-align: center;">No activity data yet</p>';
  }

  document.getElementById('loading').style.display = 'none';
  document.getElementById('stats-container').style.display = 'block';
}

function displayEntries(entries) {
  const entriesList = document.getElementById('entries-list');
  const adminToken = localStorage.getItem('adminToken');
  
  if (entries.length === 0) {
    entriesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No entries yet. Start tracking your progress!</p>';
    return;
  }

  entriesList.innerHTML = entries.slice(0, 10).map(entry => {
    const details = [];
    
    if (entry.activity_type) {
      const name = entry.activity_type === 'Other' && entry.activity_other ? entry.activity_other : entry.activity_type;
      details.push(`<div><strong>Activity:</strong> ${name}${entry.activity_amount ? ` (${entry.activity_amount})` : ''}</div>`);
    }
    if (entry.sugar_consumed > 0) {
      details.push(`<div><strong>Sugar:</strong> ${entry.sugar_consumed}g</div>`);
    }
    if (entry.snacks_count > 0) {
      details.push(`<div><strong>Snacks:</strong> ${entry.snacks_count}</div>`);
    }
    if (entry.sleep_time && entry.wake_time) {
      details.push(`<div><strong>Sleep:</strong> ${entry.sleep_time} - ${entry.wake_time}</div>`);
    }
    if (entry.studying_done) {
      details.push(`<div><strong>Studying:</strong> ✓${entry.studying_length ? ` (${entry.studying_length})` : ''}</div>`);
    }
    if (entry.social_media_time) {
      details.push(`<div><strong>Social Media:</strong> ${entry.social_media_time}</div>`);
    }
    if (entry.water_bottle_twice) {
      details.push(`<div><strong>Water:</strong> ✓ (2x bottle)</div>`);
    }
    if (entry.work_done) {
      details.push(`<div><strong>Work:</strong> ✓ (+$45)</div>`);
    }
    if (entry.volunteer_done) {
      details.push(`<div><strong>Volunteer:</strong> ✓${entry.volunteer_hours ? ` (${entry.volunteer_hours}h)` : ''}</div>`);
    }

    return `
      <div class="entry-item">
        <div class="entry-date">${formatDate(entry.date)}</div>
        <div class="entry-details">
          ${details.join('')}
        </div>
        ${adminToken ? `
          <div style="margin-top: 10px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" style="padding:10px 20px; width:auto; background:#667eea;" data-action="edit" data-id="${entry.id}">Edit</button>
            <button class="btn" style="padding:10px 20px; width:auto; background:#d9534f;" data-action="delete" data-id="${entry.id}">Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  if (adminToken) {
    entriesList.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const entry = entries.find(e => String(e.id) === String(id));
        if (entry) handleEdit(entry);
      });
    });
    entriesList.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        handleDelete(id);
      });
    });
  }
}

function formatDate(dateStr) {
  // Parse YYYY-MM-DD as a local date to avoid timezone shifting it back one day
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const fallback = new Date(dateStr);
    return fallback.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  const [year, month, day] = parts.map(p => parseInt(p, 10));
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

async function handleEdit(entry) {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    alert('Login as admin first.');
    return;
  }

  const updated = { ...entry };
  updated.date = prompt('Date (YYYY-MM-DD):', entry.date) || entry.date;
  const actType = prompt('Activity type (Gym/Sport/Run/Bike/Pushups/Sit-ups/Other):', entry.activity_type || '') || entry.activity_type;
  updated.activity_type = actType || null;
  if (updated.activity_type === 'Other') {
    updated.activity_other = prompt('Activity name (for Other):', entry.activity_other || '') || entry.activity_other || null;
  } else {
    updated.activity_other = null;
  }
  updated.activity_amount = prompt('Activity amount:', entry.activity_amount || '') || entry.activity_amount || null;
  const sugar = prompt('Sugar consumed (grams):', entry.sugar_consumed || 0);
  updated.sugar_consumed = sugar === null || sugar === '' ? entry.sugar_consumed : parseFloat(sugar) || 0;
  const snacks = prompt('Snacks count:', entry.snacks_count || 0);
  updated.snacks_count = snacks === null || snacks === '' ? entry.snacks_count : parseInt(snacks) || 0;
  updated.sleep_time = prompt('Sleep time (HH:MM):', entry.sleep_time || '') || entry.sleep_time || null;
  updated.wake_time = prompt('Wake time (HH:MM):', entry.wake_time || '') || entry.wake_time || null;
  const studying = prompt('Studying done? (y/n):', entry.studying_done ? 'y' : 'n');
  updated.studying_done = studying ? studying.toLowerCase().startsWith('y') : entry.studying_done;
  updated.studying_length = prompt('Studying length:', entry.studying_length || '') || entry.studying_length || null;
  updated.social_media_time = prompt('Social media time:', entry.social_media_time || '') || entry.social_media_time || null;
  const water = prompt('Water bottle twice? (y/n):', entry.water_bottle_twice ? 'y' : 'n');
  updated.water_bottle_twice = water ? water.toLowerCase().startsWith('y') : entry.water_bottle_twice;
  const work = prompt('Worked today? (y/n):', entry.work_done ? 'y' : 'n');
  updated.work_done = work ? work.toLowerCase().startsWith('y') : entry.work_done;
  const vol = prompt('Volunteered today? (y/n):', entry.volunteer_done ? 'y' : 'n');
  updated.volunteer_done = vol ? vol.toLowerCase().startsWith('y') : entry.volunteer_done;
  const volHours = prompt('Volunteer hours:', entry.volunteer_hours || 0);
  updated.volunteer_hours = volHours === null || volHours === '' ? entry.volunteer_hours : parseFloat(volHours) || 0;

  try {
    const response = await fetch(`/api/entries/${entry.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken
      },
      body: JSON.stringify(updated)
    });
    if (!response.ok) {
      throw new Error('Failed to update entry');
    }
    await loadEntries();
    await loadStatistics();
    alert('Entry updated');
  } catch (error) {
    console.error(error);
    alert('Update failed');
  }
}

async function handleDelete(id) {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    alert('Login as admin first.');
    return;
  }
  if (!confirm('Delete this entry?')) return;
  try {
    const response = await fetch(`/api/entries/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': adminToken }
    });
    if (!response.ok) throw new Error('Failed to delete');
    await loadEntries();
    await loadStatistics();
  } catch (error) {
    console.error(error);
    alert('Delete failed');
  }
}
