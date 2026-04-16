/* =========================================================
   MediBuddy CareLink – Emergency SOS System
   Flow: SOS → Location → Countdown → Alert → Notify
   ========================================================= */

const EmergencyService = (function () {
  let countdown = 5;
  let countdownTimer = null;
  let isCancelled = false;

  const CONTACTS = [
    { name: 'Dr. Priya Sharma',   type: 'doctor',  phone: '+91-9876543210' },
    { name: 'Rahul Kumar (Son)',  type: 'family',  phone: '+91-9876500001' },
    { name: 'Sunita Devi (Wife)', type: 'family',  phone: '+91-9876500002' },
    { name: 'Emergency (108)',    type: 'ambulance', phone: '108' },
  ];

  function open() {
    isCancelled = false;
    countdown = 5;
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.remove('hidden');
    detectLocation();
    startCountdown();
    speak('Emergency SOS activated. Sending alert in 5 seconds. Touch cancel to stop.');
  }

  function detectLocation() {
    const locEl = document.getElementById('em-location');
    if (!navigator.geolocation) {
      if (locEl) locEl.textContent = 'Kalyanpur Village, UP (approx.)';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (locEl) {
          locEl.textContent = `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`;
        }
      },
      () => {
        if (locEl) locEl.textContent = 'Kalyanpur Village, UP (approx.)';
      },
      { timeout: 5000 }
    );
  }

  function startCountdown() {
    const numEl = document.getElementById('em-count');
    if (numEl) numEl.textContent = countdown;

    countdownTimer = setInterval(() => {
      if (isCancelled) { clearInterval(countdownTimer); return; }
      countdown--;
      if (numEl) numEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countdownTimer);
        sendAlert();
      }
    }, 1000);
  }

  function sendAlert() {
    if (isCancelled) return;
    const countEl = document.querySelector('.em-countdown');
    const statusEl = document.getElementById('em-status');

    if (countEl) countEl.style.display = 'none';
    if (statusEl) {
      statusEl.innerHTML = `
        <p>✅ Alert sent to ${CONTACTS.length} contacts</p>
        <p style="margin-top:6px;font-size:0.8rem;color:var(--text-secondary)">
          📍 Location shared · 🏥 Hospital notified · 📱 SMS sent
        </p>
      `;
    }

    // Log to console (in real app → API call)
    console.log('[EMERGENCY] SOS Alert sent:', {
      time: new Date().toISOString(),
      contacts: CONTACTS.map(c => c.name),
    });

    showToast('🆘 Emergency alert sent to all contacts!', 'danger', 6000);
    speak('Emergency alert has been sent. Help is on the way. Stay calm.');

    // Auto close after 8 seconds
    setTimeout(() => { if (!isCancelled) close(); }, 8000);
  }

  function cancel() {
    isCancelled = true;
    clearInterval(countdownTimer);
    close();
    showToast('SOS cancelled.', 'info');
    speak('Emergency alert cancelled.');
  }

  function close() {
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.add('hidden');
    countdown = 5;
    isCancelled = false;
    const countEl = document.querySelector('.em-countdown');
    const statusEl = document.getElementById('em-status');
    if (countEl) countEl.style.display = '';
    if (statusEl) statusEl.innerHTML = '';
    const numEl = document.getElementById('em-count');
    if (numEl) numEl.textContent = '5';
  }

  return { open, cancel, close };
})();

// Global wrappers for HTML onclick
function triggerEmergency() { EmergencyService.open(); }
function cancelEmergency()  { EmergencyService.cancel(); }
function closeEmergency()   { EmergencyService.close(); }
