/* =========================================================
   MediBuddy CareLink – Auth Service
   Handles Login / Register with backend or demo fallback
   ========================================================= */

const AuthService = (function () {
  'use strict';

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:4000/api'
    : 'https://medibuddy-ai-k4pn.onrender.com/api';

  // ── Session management ──────────────────────────────────
  function saveSession(user, token) {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_user',  JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
  }

  function getSession() {
    try {
      const user  = JSON.parse(localStorage.getItem('mb_user') || 'null');
      const token = localStorage.getItem('mb_token');
      return (user && token) ? { user, token } : null;
    } catch { return null; }
  }

  // ── API helpers ─────────────────────────────────────────
  async function apiPost(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ── Login ───────────────────────────────────────────────
  async function login(phone, password) {
    try {
      const data = await apiPost('/auth/login', { phone, password });
      saveSession(data.user, data.token);
      return { success: true, user: data.user, mode: 'live' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Register ────────────────────────────────────────────
  async function register(data) {
    try {
      const res = await apiPost('/auth/register', data);
      const user = { id: res.userId, name: data.name, role: data.role, language: data.language || 'en' };
      saveSession(user, res.token);
      return { success: true, user, mode: 'live' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Logout ──────────────────────────────────────────────
  function logout() {
    clearSession();
    showAuthScreen();
  }

  return { login, register, getSession, logout };
})();

/* =========================================================
   Auth Screen Controller
   ========================================================= */
(function () {
  'use strict';

  let activeTab = 'login'; // 'login' | 'register'

  // ── Mount auth screen overlay ───────────────────────────
  function mountAuthScreen() {
    const el = document.getElementById('auth-screen');
    if (el) el.style.display = 'flex';
    bindAuthForms();
  }

  // ── Hide auth screen, show app ──────────────────────────
  window.showAuthScreen = function () {
    const el = document.getElementById('auth-screen');
    if (el) el.style.display = 'flex';
    const app = document.getElementById('app');
    if (app) app.classList.add('hidden');
  };

  function hideAuthScreen(user) {
    const el = document.getElementById('auth-screen');
    if (el) el.style.display = 'none';
    const app = document.getElementById('app');
    if (app) app.classList.remove('hidden');
    updateUserUI(user);
    // Boot the main app if not already running
    if (typeof initApp === 'function' && !window._appInitialized) {
      window._appInitialized = true;
      initApp();
    }
  }

  function updateUserUI(user) {
    const nameEl   = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    const topAvatar = document.getElementById('topbar-avatar');
    const dashH1   = document.querySelector('#view-dashboard .view-header h1');
    const avatar   = user.avatar || user.name.charAt(0).toUpperCase();

    if (nameEl)    nameEl.textContent = user.name;
    if (avatarEl)  avatarEl.textContent = avatar;
    if (topAvatar) topAvatar.textContent = avatar;

    // Profile View Update
    const profName = document.getElementById('profile-name');
    const profRole = document.getElementById('profile-role');
    const profPhone = document.getElementById('profile-phone');
    const profLang = document.getElementById('profile-lang');
    const profAvatar = document.getElementById('profile-avatar');

    if (profName) profName.textContent = user.name;
    if (profRole) profRole.textContent = user.role;
    if (profPhone) profPhone.textContent = user.phone || 'N/A';
    if (profLang) profLang.textContent = user.language || 'English';
    if (profAvatar) profAvatar.textContent = avatar;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    if (dashH1) dashH1.textContent = `${greeting}, ${user.name.split(' ')[0]} 👋`;
  }

  // ── Bind tab switching and form submission ──────────────
  function bindAuthForms() {
    // Tab switching
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);

    // Demo login pills
    document.querySelectorAll('.demo-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.getElementById('login-phone').value = pill.dataset.phone;
        document.getElementById('login-password').value = pill.dataset.password;
      });
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      AuthService.logout();
    });

    // Password visibility toggle
    document.querySelectorAll('.pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        if (input && input.type === 'password') {
          input.type = 'text'; btn.textContent = '🙈';
        } else if (input) {
          input.type = 'password'; btn.textContent = '👁️';
        }
      });
    });
  }

  function switchTab(tab) {
    activeTab = tab;
    document.getElementById('tab-login')?.classList.toggle('active', tab === 'login');
    document.getElementById('tab-register')?.classList.toggle('active', tab === 'register');
    document.getElementById('login-form')?.classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form')?.classList.toggle('hidden', tab !== 'register');
    clearError();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const phone    = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');

    if (!phone || !password) return showError('Please fill in all fields.');

    setLoading(btn, true, 'Signing in…');
    const result = await AuthService.login(phone, password);
    setLoading(btn, false, '🔐 Sign In');

    if (result.success) {
      showSuccess(result.mode === 'demo' ? '✅ Demo login successful!' : '✅ Logged in!');
      setTimeout(() => hideAuthScreen(result.user), 700);
    } else {
      showError(result.error || 'Login failed. Try demo credentials below.');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const phone    = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const role     = document.getElementById('reg-role').value;
    const age      = parseInt(document.getElementById('reg-age').value) || null;
    const gender   = document.getElementById('reg-gender').value;
    const language = document.getElementById('reg-language').value;
    const btn      = document.getElementById('register-btn');

    if (!name || !phone || !password || !role) return showError('Please fill in all required fields.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');

    setLoading(btn, true, 'Creating account…');
    const result = await AuthService.register({ name, phone, password, role, age, gender, language });
    setLoading(btn, false, '🚀 Create Account');

    if (result.success) {
      showSuccess(result.mode === 'demo' ? '✅ Account created (demo mode)!' : '✅ Account created!');
      setTimeout(() => hideAuthScreen(result.user), 700);
    } else {
      showError(result.error || 'Registration failed.');
    }
  }

  // ── UI Helpers ──────────────────────────────────────────
  function showError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; el.style.color = '#FF4D6D'; }
  }

  function showSuccess(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; el.style.color = '#06D6A0'; }
  }

  function clearError() {
    const el = document.getElementById('auth-error');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  }

  function setLoading(btn, loading, text) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = text;
    if (loading) btn.style.opacity = '0.7';
    else btn.style.opacity = '1';
  }

  // ── Bootstrap ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const session = AuthService.getSession();
    if (session) {
      // Already logged in — skip auth screen
      updateUserUI(session.user);
      // auth screen stays hidden (default in HTML)
    } else {
      // Need to show auth screen after splash
      // Hook into splash end: original app.js calls initApp() — we intercept
      window._authPending = true;
    }
    mountAuthScreen();
  });

})();
