/* =========================================================
   MediBuddy CareLink – Utility Functions
   ========================================================= */

/**
 * Format a date/time string to readable form
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Toast notification
 */
function showToast(message, type = 'info', duration = 3500) {
  const existing = document.getElementById('toast-container');
  let container = existing;
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; bottom: 7rem; left: 50%;
      transform: translateX(-50%);
      z-index: 9999; display: flex; flex-direction: column;
      align-items: center; gap: 0.5rem; pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const colors = {
    info:    { bg: 'rgba(17,138,178,0.9)',  border: 'rgba(17,138,178,0.5)' },
    success: { bg: 'rgba(6,214,160,0.9)',   border: 'rgba(6,214,160,0.5)' },
    warning: { bg: 'rgba(255,183,3,0.9)',   border: 'rgba(255,183,3,0.5)' },
    danger:  { bg: 'rgba(255,77,109,0.9)',  border: 'rgba(255,77,109,0.5)' },
  };
  const c = colors[type] || colors.info;
  toast.style.cssText = `
    background: ${c.bg};
    border: 1px solid ${c.border};
    color: white; padding: 0.75rem 1.5rem;
    border-radius: 999px; font-size: 0.88rem; font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: fadeInUp 0.3s ease;
    pointer-events: none;
    max-width: 340px; text-align: center;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Animate a number counting up
 */
function animateCounter(el, start, end, duration = 800) {
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (end - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Simulate a small vitals flicker every few seconds
 */
function startVitalsSimulation() {
  setInterval(() => {
    const hrEl = document.getElementById('hr-value');
    const spo2El = document.getElementById('spo2-value');
    if (hrEl) hrEl.textContent = randInt(68, 78);
    if (spo2El) spo2El.textContent = randInt(97, 99);
  }, 4000);
}

/**
 * Close a modal by ID
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

/**
 * Show directions (placeholder)
 */
function showDirections(place) {
  showToast(`🗺️ Opening directions to ${place}…`, 'info');
}

/**
 * Speak text using Web Speech API
 */
function speak(text, lang = 'en-IN') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
