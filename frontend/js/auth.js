const AuthService = (function () {
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000/api/auth' : 'https://medibuddy-ai-k4pn.onrender.com/api/auth';

  let currentEmail = '';

  function init() {
    bindEvents();
    checkSession();
  }

  function bindEvents() {
    // Switch between forms
    document.getElementById('go-to-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('register-form').style.display = 'block';
    });
    document.getElementById('go-to-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('register-form').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
    });

    // Login
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        localStorage.setItem('medibuddy_session', JSON.stringify(data));
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });

    // Register
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const role = document.getElementById('reg-role').value;
      
      try {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        currentEmail = email;
        document.getElementById('otp-target-email').textContent = email;
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('otp-view').style.display = 'block';
        startOTPTimer();
      } catch (err) {
        alert(err.message);
      }
    });

    // Verify OTP
    document.getElementById('verify-otp-btn')?.addEventListener('click', async () => {
      const otp = document.getElementById('otp-code').value;
      try {
        const res = await fetch(`${API_URL}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentEmail, otp })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        alert('Account verified! Please login.');
        document.getElementById('otp-view').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
      } catch (err) {
        alert(err.message);
      }
    });

    // Resend OTP
    document.getElementById('resend-otp-btn')?.addEventListener('click', async () => {
      alert('New OTP sent to ' + currentEmail);
      // Implementation for resend-otp API call would go here
    });

    // Password Toggle
    document.querySelectorAll('.pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
      });
    });
  }

  function startOTPTimer() {
    let timeLeft = 300;
    const timerEl = document.getElementById('otp-countdown');
    const interval = setInterval(() => {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      if (timerEl) timerEl.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
      if (timeLeft <= 0) clearInterval(interval);
      timeLeft--;
    }, 1000);
  }

  function checkSession() {
    const sessionStr = localStorage.getItem('medibuddy_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-shell').style.display = 'flex';
        updateUserUI(session.user);
      } catch (err) {
        localStorage.removeItem('medibuddy_session');
      }
    }
  }

  function updateUserUI(user) {
    const dashH1 = document.querySelector('#view-dashboard h1');
    const avatar = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    const topAvatar = document.getElementById('topbar-avatar');
    if (topAvatar) topAvatar.textContent = avatar;

    if (dashH1 && user.name) {
      dashH1.textContent = `Welcome back, ${user.name.split(' ')[0]} 👋`;
    }

    // Profile updates
    const profName = document.getElementById('profile-name');
    const profEmail = document.getElementById('profile-phone'); // UI uses phone slot for email/info
    if (profName) profName.textContent = user.name;
    if (profEmail) profEmail.textContent = user.email || 'N/A';
  }

  function logout() {
    localStorage.removeItem('medibuddy_session');
    window.location.reload();
  }

  return { init, logout, updateUserUI, getSession: () => JSON.parse(localStorage.getItem('medibuddy_session')) };
})();

document.addEventListener('DOMContentLoaded', () => AuthService.init());
