import { auth, db } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

let currentUser = null;

// Track auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.max = today; // Prevent future dates

  const form = document.getElementById('journalForm');
  form.addEventListener('submit', handleSubmit);

  const activitySelect = document.getElementById('activity_type');
  const activityOtherInput = document.getElementById('activity_other');
  activitySelect.addEventListener('change', () => {
    if (activitySelect.value === 'Other') {
      activityOtherInput.style.display = 'block';
    } else {
      activityOtherInput.style.display = 'none';
      activityOtherInput.value = '';
    }
  });

  const volunteerCheckbox = document.getElementById('volunteer_done');
  const volunteerHours = document.getElementById('volunteer_hours');
  volunteerCheckbox.addEventListener('change', () => {
    volunteerHours.style.display = volunteerCheckbox.checked ? 'block' : 'none';
    if (!volunteerCheckbox.checked) volunteerHours.value = '';
  });
});

async function handleSubmit(e) {
  e.preventDefault();

  if (!currentUser) {
    showMessage('Please log in as admin first.', 'error');
    return;
  }
  
  const formData = new FormData(e.target);
  const entry = {
    date: formData.get('date'),
    activity_type: formData.get('activity_type') || null,
    activity_amount: formData.get('activity_amount') || null,
    activity_other: formData.get('activity_type') === 'Other' ? (formData.get('activity_other') || null) : null,
    sugar_consumed: parseFloat(formData.get('sugar_consumed')) || 0,
    snacks_count: parseInt(formData.get('snacks_count')) || 0,
    sleep_time: formData.get('sleep_time') || null,
    wake_time: formData.get('wake_time') || null,
    studying_done: formData.get('studying_done') === 'on',
    studying_length: formData.get('studying_length') || null,
    social_media_time: formData.get('social_media_time') || null,
    water_bottle_twice: formData.get('water_bottle_twice') === 'on',
    work_done: formData.get('work_done') === 'on',
    volunteer_done: formData.get('volunteer_done') === 'on',
    volunteer_hours: parseFloat(formData.get('volunteer_hours')) || 0,
    created_at: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'entries'), entry);
    showMessage('Entry saved successfully!', 'success');
    e.target.reset();
    // Reset date to today
    const dateInput = document.getElementById('date');
    dateInput.value = new Date().toISOString().split('T')[0];
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
