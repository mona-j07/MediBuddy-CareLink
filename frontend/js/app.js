/* =========================================================
   MediBuddy CareLink – Main App Controller
   Initializes all modules, handles navigation, events
   ========================================================= */

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  const state = {
    currentView: 'dashboard',
    voicePanelOpen: false,
  };

  // ── View Map ─────────────────────────────────────────────
  const VIEW_LABELS = {
    dashboard:      'Dashboard',
    triage:         '🩺 AI Triage',
    medicine:       '💊 Medicines',
    'health-history': '📋 Health History',
    maps:           '🗺️ Nearby Healthcare',
    community:      '🌍 Community Health',
    family:         '👨‍👩‍👧 Family Hub',
    doctor:         '👨‍⚕️ Doctor Connect',
  };

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initSplash();
  });

  function initSplash() {
    const initText = document.getElementById('init-text');
    const initSteps = [
      'Initializing Voice AI Engine…',
      'Loading Triage Knowledge Base…',
      'Connecting Health Services…',
      'Fetching Location Data…',
      'MediBuddy CareLink Ready ✓',
    ];
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < initSteps.length) {
        if (initText) initText.textContent = initSteps[step];
      } else {
        clearInterval(stepInterval);
      }
    }, 500);

    // After 2.8s, check auth then show app or auth screen
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.transition = 'opacity 0.6s ease';
        splash.style.opacity = '0';
        setTimeout(() => { splash.style.display = 'none'; }, 600);
      }

      // Check if user is already authenticated
      const session = typeof AuthService !== 'undefined' && AuthService.getSession();
      if (session) {
        // Logged in — go straight to app
        const app = document.getElementById('app');
        if (app) app.classList.remove('hidden');
        initApp();
      } else {
        // Not logged in — show auth screen
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.style.display = 'flex';
      }
    }, 2800);
  }

  function initApp() {
    bindNavigation();
    bindVoiceControls();
    bindTriageControls();
    bindMedicineControls();
    bindHistoryFilters();
    bindNotifications();
    bindSidebar();
    bindLanguageSelector();

    // Init sub-modules
    MedicineService.render();
    CommunityService.render();
    FamilyService.render();
    DoctorService.render();
    HistoryService.render('all');

    // Init voice engine
    VoiceEngine.init('en');

    // Start vitals simulation
    startVitalsSimulation();

    // Announce app load
    setTimeout(() => {
      speak('Welcome to MediBuddy CareLink. Tap the microphone to speak.');
    }, 1000);
  }

  // Expose initApp globally so auth.js can call it after login
  window.initApp = initApp;

  // ── Navigation ───────────────────────────────────────────
  function bindNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);
      });
    });

    // Emergency nav
    const emNav = document.getElementById('nav-emergency');
    if (emNav) emNav.addEventListener('click', triggerEmergency);
  }

  // ── switchView (global) ──────────────────────────────────
  window.switchView = function (viewId) {
    if (!document.getElementById(`view-${viewId}`)) return;

    // Deactivate old view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Activate new view
    const view = document.getElementById(`view-${viewId}`);
    const navBtn = document.getElementById(`nav-${viewId}`);
    if (view) view.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    state.currentView = viewId;

    // Update breadcrumb
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.textContent = VIEW_LABELS[viewId] || viewId;

    // Lazy-render community/family/doctor/history when visited
    if (viewId === 'community')      CommunityService.render();
    if (viewId === 'family')         FamilyService.render();
    if (viewId === 'doctor')         DoctorService.render();
    if (viewId === 'health-history') HistoryService.render('all');

    // Close sidebar on mobile
    if (window.innerWidth <= 900) {
      document.getElementById('sidebar')?.classList.remove('open');
    }

    // Scroll to top
    document.querySelector('.views-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Voice Controls ───────────────────────────────────────
  function bindVoiceControls() {
    const fab = document.getElementById('voice-fab');
    if (fab) fab.addEventListener('click', () => {
      const panel = document.getElementById('voice-panel');
      if (panel && panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        VoiceEngine.startListening();
        state.voicePanelOpen = true;
      } else {
        panel?.classList.add('hidden');
        VoiceEngine.stopListening();
        state.voicePanelOpen = false;
      }
    });

    const closeBtn = document.getElementById('close-voice');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      VoiceEngine.closePanel();
      state.voicePanelOpen = false;
    });
  }

  // ── Triage Controls ──────────────────────────────────────
  function bindTriageControls() {
    // Symptom buttons
    document.querySelectorAll('.symptom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
        TriageAI.toggleSymptom(btn.dataset.symptom);
      });
    });

    // Severity slider
    const severitySlider = document.getElementById('triage-severity');
    const severityLabel  = document.getElementById('severity-label');
    if (severitySlider) {
      severitySlider.addEventListener('input', () => {
        if (severityLabel) severityLabel.textContent = severitySlider.value;
      });
    }

    // Analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', () => TriageAI.run());

    // Re-assess button
    const reTriageBtn = document.getElementById('btn-retriage');
    if (reTriageBtn) reTriageBtn.addEventListener('click', () => TriageAI.reset());
  }

  // ── Medicine Controls ────────────────────────────────────
  function bindMedicineControls() {
    const addBtn = document.getElementById('add-medicine-btn');
    if (addBtn) addBtn.addEventListener('click', () => MedicineService.openAddModal());

    const saveBtn = document.getElementById('save-medicine-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => MedicineService.addMedicine());
  }

  // ── History Filters ──────────────────────────────────────
  function bindHistoryFilters() {
    document.querySelectorAll('.history-filters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.history-filters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        HistoryService.render(btn.dataset.filter);
      });
    });
  }

  // ── Notifications ────────────────────────────────────────
  function bindNotifications() {
    const bell  = document.getElementById('notif-btn');
    const panel = document.getElementById('notif-panel');
    if (bell) bell.addEventListener('click', () => {
      panel?.classList.toggle('hidden');
      // Clear badge
      const badge = document.getElementById('notif-badge');
      if (badge) badge.style.display = 'none';
    });
  }

  window.closeNotif = function () {
    document.getElementById('notif-panel')?.classList.add('hidden');
  };

  // ── Sidebar (Mobile) ─────────────────────────────────────
  function bindSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuBtn) menuBtn.addEventListener('click', () => sidebar?.classList.toggle('open'));
    if (sidebarToggle) sidebarToggle.addEventListener('click', () => sidebar?.classList.remove('open'));

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        if (!sidebar?.contains(e.target) && !menuBtn?.contains(e.target)) {
          sidebar?.classList.remove('open');
        }
      }
    });
  }

  // ── Language Selector ────────────────────────────────────
  function bindLanguageSelector() {
    const sel = document.getElementById('language-select');
    if (sel) sel.addEventListener('change', () => {
      VoiceEngine.setLanguage(sel.value);
    });
  }

})();
