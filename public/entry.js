// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.max = today; // Prevent future dates

  const form = document.getElementById('journalForm');
  form.addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const entry = {
    date: formData.get('date'),
    activity_type: formData.get('activity_type') || null,
    activity_amount: formData.get('activity_amount') || null,
    sugar_consumed: parseFloat(formData.get('sugar_consumed')) || 0,
    snacks_count: parseInt(formData.get('snacks_count')) || 0,
    sleep_time: formData.get('sleep_time') || null,
    wake_time: formData.get('wake_time') || null,
    studying_done: formData.get('studying_done') === 'on',
    studying_length: formData.get('studying_length') || null,
    social_media_time: formData.get('social_media_time') || null,
    water_bottle_twice: formData.get('water_bottle_twice') === 'on'
  };

  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    });

    if (response.ok) {
      showMessage('Entry saved successfully!', 'success');
      e.target.reset();
      // Reset date to today
      const dateInput = document.getElementById('date');
      dateInput.value = new Date().toISOString().split('T')[0];
    } else {
      const error = await response.json();
      showMessage(error.error || 'Failed to save entry', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Failed to save entry. Please try again.', 'error');
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}
