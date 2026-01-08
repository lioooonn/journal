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
  
  if (entries.length === 0) {
    entriesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No entries yet. Start tracking your progress!</p>';
    return;
  }

  entriesList.innerHTML = entries.slice(0, 10).map(entry => {
    const details = [];
    
    if (entry.activity_type) {
      details.push(`<div><strong>Activity:</strong> ${entry.activity_type}${entry.activity_amount ? ` (${entry.activity_amount})` : ''}</div>`);
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

    return `
      <div class="entry-item">
        <div class="entry-date">${formatDate(entry.date)}</div>
        <div class="entry-details">
          ${details.join('')}
        </div>
      </div>
    `;
  }).join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
