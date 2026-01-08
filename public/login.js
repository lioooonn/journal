document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('password').value.trim();
  if (!password) return;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error || 'Login failed', 'error');
      return;
    }
    localStorage.setItem('adminToken', data.token);
    showMessage('Login successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = '/', 800);
  } catch (err) {
    console.error(err);
    showMessage('Login failed. Try again.', 'error');
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
