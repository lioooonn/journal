import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', handleLogin);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      showMessage('Already logged in.', 'success');
    }
  });
});

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) return;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('Login successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = '/', 800);
  } catch (err) {
    console.error(err);
    showMessage('Login failed. Check your email/password.', 'error');
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 4000);
}
