/* =========================================================
   MediBuddy CareLink – Voice Engine
   Pipeline: Capture → Detect Language → STT → Intent →
             Symptom Extraction → API → TTS Response
   ========================================================= */

const VoiceEngine = (function () {
  let recognition = null;
  let isListening = false;
  let currentLang = 'en-IN';

  // Language map for Web Speech API
  const LANG_MAP = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
  };

  // ── Intent patterns ──────────────────────────────────────
  const INTENTS = [
    {
      name: 'SYMPTOM_CHECK',
      patterns: [/fever|headache|cough|pain|breathless|vomit|diarrhea|rash|dizzy|fatigue|nausea|chest|stomach/i],
      keywords: ['symptom', 'feeling', 'sick', 'ill', 'hurt', 'pain', 'unwell', 'problem'],
    },
    {
      name: 'EMERGENCY_ALERT',
      patterns: [/emergency|sos|help me|call ambulance|heart attack|unconscious|accident|stroke/i],
      keywords: ['emergency', 'sos', 'help', 'ambulance', 'dying'],
    },
    {
      name: 'CALL_DOCTOR',
      patterns: [/call doctor|consult|book appointment|speak to doctor|video call/i],
      keywords: ['doctor', 'consult', 'appointment', 'call'],
    },
    {
      name: 'SHOW_MEDICINES',
      patterns: [/medicine|medication|tablet|pill|dose|my medicines|show medicine/i],
      keywords: ['medicine', 'tablet', 'pill', 'drug', 'prescription'],
    },
    {
      name: 'FIND_HOSPITAL',
      patterns: [/hospital|clinic|pharmacy|nearest|nearby|location|phc/i],
      keywords: ['hospital', 'clinic', 'pharmacy', 'doctor nearby', 'healthcare'],
    },
    {
      name: 'HEALTH_HISTORY',
      patterns: [/history|past|record|previous|reports|lab/i],
      keywords: ['history', 'past', 'record', 'report'],
    },
    {
      name: 'ADD_MEDICINE',
      patterns: [/add medicine|add tablet|add pill|remind me/i],
      keywords: ['add', 'remind'],
    },
  ];

  // ── Symptom keyword map ──────────────────────────────────
  const SYMPTOM_KEYWORDS = {
    fever: ['fever', 'temperature', 'hot', 'burning'],
    headache: ['headache', 'head pain', 'migraine', 'head ache'],
    cough: ['cough', 'coughing', 'dry cough', 'wet cough'],
    breathlessness: ['breathless', 'short of breath', 'difficulty breathing', 'cannot breathe'],
    chest_pain: ['chest pain', 'chest tightness', 'heart pain'],
    stomachache: ['stomach pain', 'abdominal pain', 'belly pain', 'stomach ache'],
    vomiting: ['vomiting', 'vomit', 'throwing up', 'nausea vomiting'],
    diarrhea: ['diarrhea', 'loose motion', 'loose stool', 'dysentery'],
    dizziness: ['dizzy', 'dizziness', 'giddiness', 'vertigo'],
    fatigue: ['fatigue', 'tired', 'weakness', 'lethargy'],
    joint_pain: ['joint pain', 'body ache', 'muscle pain', 'arthritis'],
    rash: ['rash', 'skin rash', 'itching', 'allergy'],
    eye_pain: ['eye pain', 'eye redness', 'irritation in eye'],
    ear_pain: ['ear pain', 'ear ache', 'cannot hear'],
    nausea: ['nausea', 'feeling sick', 'queasy'],
    back_pain: ['back pain', 'lower back pain', 'backache'],
  };

  // ── Response templates ───────────────────────────────────
  const RESPONSES = {
    SYMPTOM_CHECK: (symptoms) =>
      `I heard you mention ${symptoms.length > 0 ? symptoms.join(', ') : 'some symptoms'}. Running AI triage analysis now…`,
    EMERGENCY_ALERT: () =>
      'Emergency SOS triggered! Alerting your contacts and nearest hospital now. Stay calm.',
    CALL_DOCTOR: () =>
      'Opening doctor connect. Dr. Priya Sharma is currently online.',
    SHOW_MEDICINES: () =>
      'Here are your medicines for today. You have 2 doses pending.',
    FIND_HOSPITAL: () =>
      'Showing nearby hospitals and clinics. District Hospital is 1.2 km from you.',
    HEALTH_HISTORY: () =>
      'Opening your health history. You have 4 records from this week.',
    ADD_MEDICINE: () =>
      'Opening medicine tracker to add a new medicine.',
    UNKNOWN: () =>
      'I did not understand that. Please try saying: "I have fever", "Show medicines", or "Emergency help".',
  };

  // ── Initialize Web Speech API ────────────────────────────
  function init(langCode = 'en') {
    currentLang = LANG_MAP[langCode] || 'en-IN';

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech API not supported. Using simulation mode.');
      return false;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = currentLang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = handleStart;
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    return true;
  }

  function handleStart() {
    isListening = true;
    updateVoiceUI('listening');
  }

  function handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript;
      else interimTranscript += transcript;
    }

    const display = finalTranscript || interimTranscript;
    updateTranscript(display);

    if (finalTranscript) processVoiceInput(finalTranscript);
  }

  function handleError(event) {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      showToast('🎤 Microphone permission denied. Using simulation mode.', 'warning');
    }
    stopListening();
  }

  function handleEnd() {
    isListening = false;
    updateVoiceUI('idle');
  }

  // ── Start/Stop ───────────────────────────────────────────
  function startListening() {
    if (!recognition && !init()) {
      updateVoiceUI('listening');
      return;
    }
    try {
      recognition.lang = currentLang;
      recognition.start();
    } catch (e) {
      console.warn('Recognition already started');
    }
  }

  function stopListening() {
    try { if (recognition) recognition.stop(); } catch (e) {}
    isListening = false;
    updateVoiceUI('idle');
  }

  function toggle() {
    if (isListening) stopListening();
    else startListening();
  }

  // ── Process Voice Input ──────────────────────────────────
  function processVoiceInput(text) {
    const intent = detectIntent(text);
    const symptoms = extractSymptoms(text);
    const confidence = parseFloat((0.75 + Math.random() * 0.22).toFixed(2));

    const result = { intent, symptoms, confidence, text };
    updateRecognized(text);
    respondToIntent(result);
    executeAction(result);

    return result;
  }

  function detectIntent(text) {
    const t = text.toLowerCase();
    for (const intent of INTENTS) {
      if (intent.patterns.some(p => p.test(t))) return intent.name;
      if (intent.keywords.some(k => t.includes(k))) return intent.name;
    }
    return 'UNKNOWN';
  }

  function extractSymptoms(text) {
    const t = text.toLowerCase();
    const found = [];
    for (const [symptom, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      if (keywords.some(k => t.includes(k))) found.push(symptom);
    }
    return found;
  }

  function respondToIntent(result) {
    const fn = RESPONSES[result.intent] || RESPONSES.UNKNOWN;
    const response = fn(result.symptoms);
    updateVoiceResponse(response);
    speak(response, currentLang);
  }

  function executeAction(result) {
    switch (result.intent) {
      case 'SYMPTOM_CHECK':
        switchView('triage');
        if (result.symptoms.length > 0) {
          setTimeout(() => {
            result.symptoms.forEach(s => selectSymptom(s));
          }, 600);
        }
        break;
      case 'EMERGENCY_ALERT':
        setTimeout(() => triggerEmergency(), 800);
        break;
      case 'CALL_DOCTOR':
        switchView('doctor');
        break;
      case 'SHOW_MEDICINES':
        switchView('medicine');
        break;
      case 'FIND_HOSPITAL':
        switchView('maps');
        break;
      case 'HEALTH_HISTORY':
        switchView('health-history');
        break;
      case 'ADD_MEDICINE':
        switchView('medicine');
        setTimeout(() => {
          const btn = document.getElementById('add-medicine-btn');
          if (btn) btn.click();
        }, 600);
        break;
    }
  }

  // ── UI Updates ───────────────────────────────────────────
  function updateVoiceUI(state) {
    const fab = document.getElementById('voice-fab');
    const container = document.getElementById('voice-fab-container');
    const dot = document.getElementById('voice-status-dot');
    const title = document.getElementById('voice-panel-title');
    const bars = document.querySelectorAll('.wave-bar');

    if (state === 'listening') {
      if (fab) fab.classList.add('listening');
      if (container) container.classList.add('active');
      if (dot) { dot.style.background = 'var(--danger)'; dot.style.boxShadow = '0 0 8px var(--danger)'; }
      if (title) title.textContent = '🎤 Listening…';
      bars.forEach(b => { b.style.animationDuration = '0.4s'; });
    } else {
      if (fab) fab.classList.remove('listening');
      if (container) container.classList.remove('active');
      if (dot) { dot.style.background = 'var(--success)'; dot.style.boxShadow = '0 0 8px var(--success)'; }
      if (title) title.textContent = 'Voice Assistant Active';
      bars.forEach(b => { b.style.animationDuration = '1s'; });
    }
  }

  function updateTranscript(text) {
    const el = document.getElementById('voice-transcript');
    if (el) el.innerHTML = `<span style="color:var(--text-primary)">${text}</span>`;
  }

  function updateRecognized(text) {
    const el = document.getElementById('voice-recognized');
    if (el) el.textContent = `"${text}"`;
  }

  function updateVoiceResponse(text) {
    const el = document.getElementById('voice-response');
    if (el) el.textContent = `🤖 ${text}`;
  }

  // ── Simulate voice (for demo / click) ───────────────────
  function simulate(text) {
    openPanel();
    updateTranscript(text);
    updateVoiceUI('listening');
    setTimeout(() => {
      processVoiceInput(text);
      updateVoiceUI('idle');
    }, 1000);
  }

  function openPanel() {
    const panel = document.getElementById('voice-panel');
    if (panel) panel.classList.remove('hidden');
  }

  function closePanel() {
    const panel = document.getElementById('voice-panel');
    if (panel) panel.classList.add('hidden');
    stopListening();
  }

  function setLanguage(langCode) {
    currentLang = LANG_MAP[langCode] || 'en-IN';
    if (recognition) recognition.lang = currentLang;
    showToast(`🌐 Voice language set to ${langCode.toUpperCase()}`, 'info');
  }

  return { init, startListening, stopListening, toggle, simulate, openPanel, closePanel, setLanguage, processVoiceInput };
})();

// Expose simulate globally for intent chips
function simulateVoice(text) { VoiceEngine.simulate(text); }
