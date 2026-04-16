/* =========================================================
   MediBuddy CareLink – AI Triage Engine
   Symptom → Disease probability → Severity → First Aid
   ========================================================= */

const TriageAI = (function () {

  // ── Disease Knowledge Base ───────────────────────────────
  const DISEASE_DB = [
    {
      name: 'Common Cold / Flu',
      symptoms: ['fever', 'headache', 'cough', 'fatigue', 'nausea'],
      severity: 'green',
      probability: 0,
      firstAid: [
        'Rest and stay hydrated — drink at least 8–10 glasses of water.',
        'Take paracetamol for fever if temperature exceeds 100°F.',
        'Gargle with warm salt water for throat relief.',
        'Avoid cold foods and beverages.',
        'Monitor temperature every 4 hours.',
      ],
      note: 'Usually resolves in 5–7 days with self-care.',
    },
    {
      name: 'Dengue Fever',
      symptoms: ['fever', 'headache', 'joint_pain', 'rash', 'eye_pain', 'fatigue'],
      severity: 'yellow',
      probability: 0,
      firstAid: [
        'Seek medical evaluation immediately — dengue requires blood tests.',
        'Stay well-hydrated with ORS, coconut water or fruit juices.',
        'Do NOT take Aspirin or Ibuprofen — use only Paracetamol.',
        'Monitor platelet count — go to clinic if count drops.',
        'Use mosquito nets and repellents.',
      ],
      note: 'Dengue can become severe. Clinic visit is strongly advised.',
    },
    {
      name: 'Gastroenteritis',
      symptoms: ['stomachache', 'vomiting', 'diarrhea', 'nausea', 'fever', 'fatigue'],
      severity: 'yellow',
      probability: 0,
      firstAid: [
        'Drink ORS (Oral Rehydration Solution) frequently.',
        'Eat light — rice, curd, banana, toast (BRAT diet).',
        'Avoid spicy, oily foods until fully recovered.',
        'Wash hands thoroughly before eating.',
        'If vomiting persists >24 hours, visit clinic.',
      ],
      note: 'Dehydration is the main risk. Maintain fluid intake.',
    },
    {
      name: 'Cardiac Emergency',
      symptoms: ['chest_pain', 'breathlessness', 'fatigue', 'dizziness', 'nausea'],
      severity: 'red',
      probability: 0,
      firstAid: [
        '🆘 CALL EMERGENCY SERVICES IMMEDIATELY (108).',
        'Ask patient to sit or lie down comfortably.',
        'Loosen tight clothing around chest and neck.',
        'If patient is conscious, give aspirin (if not allergic).',
        'Do NOT leave the patient alone. Begin CPR if unconscious.',
      ],
      note: 'This is a LIFE-THREATENING emergency. Act immediately.',
    },
    {
      name: 'Respiratory Infection',
      symptoms: ['cough', 'fever', 'breathlessness', 'fatigue', 'chest_pain'],
      severity: 'yellow',
      probability: 0,
      firstAid: [
        'Steam inhalation 2–3 times daily for congestion relief.',
        'Drink warm liquids — ginger tea, honey with warm water.',
        'Use prescribed inhalers if you have asthma.',
        'Avoid dust, smoke and cold air.',
        'Visit clinic if breathing difficulty increases.',
      ],
      note: 'Monitor oxygen saturation if available.',
    },
    {
      name: 'Heat Stroke / Dehydration',
      symptoms: ['dizziness', 'headache', 'fatigue', 'nausea', 'fever'],
      severity: 'yellow',
      probability: 0,
      firstAid: [
        'Move to a cool, shaded area immediately.',
        'Drink cold water or ORS solution slowly.',
        'Apply cold wet cloth to forehead and neck.',
        'Rest for at least 1–2 hours.',
        'Seek medical help if symptoms persist.',
      ],
      note: 'Severe dehydration can lead to organ damage.',
    },
    {
      name: 'Migraine',
      symptoms: ['headache', 'nausea', 'dizziness', 'fatigue', 'eye_pain'],
      severity: 'green',
      probability: 0,
      firstAid: [
        'Rest in a dark, quiet room.',
        'Apply cold or warm compress to head/neck.',
        'Take prescribed migraine medication at onset.',
        'Stay hydrated — dehydration worsens migraines.',
        'Avoid bright screens and loud sounds.',
      ],
      note: 'Track triggers — stress, certain foods, sleep changes.',
    },
    {
      name: 'Skin Allergy / Dermatitis',
      symptoms: ['rash', 'fatigue', 'eye_pain'],
      severity: 'green',
      probability: 0,
      firstAid: [
        'Identify and avoid the allergen if known.',
        'Apply calamine lotion or hydrocortisone cream.',
        'Antihistamine tablets (e.g. Cetirizine) can reduce itching.',
        'Do not scratch — it worsens the rash.',
        'Cool compress on the affected area.',
      ],
      note: 'If rash spreads or breathing is affected, seek emergency care.',
    },
    {
      name: 'Stroke (Neurological)',
      symptoms: ['dizziness', 'headache', 'vomiting', 'back_pain'],
      severity: 'red',
      probability: 0,
      firstAid: [
        '🆘 CALL 108 IMMEDIATELY — time is critical.',
        'Use FAST test: Face drooping, Arm weakness, Speech slurring.',
        'Lay the patient on their side safely.',
        'Do NOT give food, water or medication orally.',
        'Note exact time symptoms started — tell doctors.',
      ],
      note: 'Stroke is a medical emergency. Every minute counts.',
    },
  ];

  // ── Selected symptoms state ──────────────────────────────
  let selectedSymptoms = new Set();

  // ── Public: Toggle symptom ───────────────────────────────
  function toggleSymptom(symptomId) {
    if (selectedSymptoms.has(symptomId)) selectedSymptoms.delete(symptomId);
    else selectedSymptoms.add(symptomId);
    updateSymptomDisplay();
  }

  function selectSymptom(symptomId) {
    selectedSymptoms.add(symptomId);
    updateSymptomDisplay();
    const btn = document.querySelector(`[data-symptom="${symptomId}"]`);
    if (btn) btn.classList.add('selected');
  }

  function updateSymptomDisplay() {
    const tagsEl = document.getElementById('symptom-tags');
    const arr = Array.from(selectedSymptoms);
    if (tagsEl) {
      tagsEl.textContent = arr.length > 0
        ? arr.map(s => s.replace('_', ' ')).join(', ')
        : 'None';
    }
  }

  // ── Core Triage Algorithm ────────────────────────────────
  function analyze(symptoms, age, severity) {
    if (symptoms.length === 0) return null;

    // Score each disease by symptom overlap
    const scored = DISEASE_DB.map(disease => {
      const overlap = disease.symptoms.filter(s => symptoms.includes(s)).length;
      const total   = Math.max(disease.symptoms.length, symptoms.length);
      let probability = overlap / total;

      // Age adjustments
      if (age > 60) {
        if (['Cardiac Emergency', 'Stroke (Neurological)'].includes(disease.name)) probability *= 1.4;
        if (['Dengue Fever', 'Respiratory Infection'].includes(disease.name)) probability *= 1.2;
      }

      // Severity adjustments
      if (severity >= 8) probability *= 1.25;
      if (severity <= 3) probability *= 0.8;

      // Cap at 0.97
      probability = Math.min(probability, 0.97);

      return { ...disease, probability: parseFloat(probability.toFixed(2)) };
    });

    // Sort by probability descending
    scored.sort((a, b) => b.probability - a.probability);

    // Top 3 diseases with probability > 0
    const topDiseases = scored.filter(d => d.probability > 0.1).slice(0, 3);

    if (topDiseases.length === 0) return null;

    // Highest severity among top diseases
    const severityPriority = { red: 3, yellow: 2, green: 1 };
    topDiseases.sort((a, b) => severityPriority[b.severity] - severityPriority[a.severity]);
    const primary = topDiseases[0];

    // Overall confidence
    const confidence = Math.round(primary.probability * 100);

    return {
      primary,
      diseases: topDiseases,
      severity: primary.severity,
      confidence,
      firstAid: primary.firstAid,
    };
  }

  // ── Render Result ────────────────────────────────────────
  function renderResult(result) {
    const container = document.getElementById('triage-result');
    if (!container) return;
    container.classList.remove('hidden');

    // Confidence bar
    const confFill = document.getElementById('confidence-fill');
    const confScore = document.getElementById('confidence-score');
    if (confFill) confFill.style.width = `${result.confidence}%`;
    if (confScore) confScore.textContent = `${result.confidence}%`;

    // Severity badge
    const badge = document.getElementById('severity-badge');
    const icon  = document.getElementById('severity-icon');
    const level = document.getElementById('severity-level');
    const desc  = document.getElementById('severity-desc');

    const severityMap = {
      green:  { icon: '🟢', level: 'SELF-CARE RECOMMENDED',    desc: 'Your symptoms suggest a mild condition. Follow first-aid instructions at home.', class: 'green' },
      yellow: { icon: '🟡', level: 'CLINIC VISIT ADVISED',     desc: 'Your symptoms suggest a moderate condition requiring professional evaluation.', class: 'yellow' },
      red:    { icon: '🔴', level: '⚡ EMERGENCY – SEEK CARE', desc: 'Potentially life-threatening. Please call emergency services or go to hospital IMMEDIATELY.', class: 'red' },
    };
    const sev = severityMap[result.severity] || severityMap.yellow;
    if (badge) { badge.className = `severity-badge-large ${sev.class}`; }
    if (icon)  icon.textContent  = sev.icon;
    if (level) level.textContent = sev.level;
    if (desc)  desc.textContent  = sev.desc;

    // Diagnosis cards
    const diagCards = document.getElementById('diagnosis-cards');
    if (diagCards) {
      diagCards.innerHTML = result.diseases.map(d => `
        <div class="diagnosis-card">
          <div class="diag-name">${d.name}</div>
          <div class="diag-bar-wrap">
            <div class="diag-bar-track">
              <div class="diag-bar-fill" style="width:${Math.round(d.probability * 100)}%"></div>
            </div>
            <span class="diag-pct">${Math.round(d.probability * 100)}%</span>
          </div>
        </div>
      `).join('');
    }

    // First aid
    const firstaidList = document.getElementById('firstaid-list');
    if (firstaidList) {
      firstaidList.innerHTML = result.firstAid.map(step =>
        `<div class="firstaid-item">${step}</div>`
      ).join('');
    }

    // Scroll to result
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Announce by voice
    const announcement = `AI Triage complete. ${sev.level}. ${result.primary.name} is the most likely condition with ${result.confidence}% confidence.`;
    speak(announcement);

    // High severity = auto show emergency option
    if (result.severity === 'red') {
      showToast('⚠️ High severity detected! Consider Emergency SOS.', 'danger', 6000);
    }
  }

  // ── Re-assess ────────────────────────────────────────────
  function reset() {
    selectedSymptoms.clear();
    document.querySelectorAll('.symptom-btn').forEach(b => b.classList.remove('selected'));
    updateSymptomDisplay();
    const result = document.getElementById('triage-result');
    if (result) result.classList.add('hidden');
  }

  // ── Run analysis ─────────────────────────────────────────
  function run() {
    const symptoms = Array.from(selectedSymptoms);
    if (symptoms.length === 0) {
      showToast('Please select at least one symptom.', 'warning');
      return;
    }

    const age      = parseInt(document.getElementById('triage-age')?.value || 55);
    const severity = parseInt(document.getElementById('triage-severity')?.value || 5);
    const btn      = document.getElementById('analyze-btn');

    // Show loading
    if (btn) { btn.textContent = '⏳ Analyzing…'; btn.disabled = true; }

    setTimeout(() => {
      const result = analyze(symptoms, age, severity);
      if (btn) { btn.innerHTML = '<span class="btn-icon">🧠</span> Analyze with AI'; btn.disabled = false; }
      if (!result) {
        showToast('No matching condition found. Please add more symptoms.', 'warning');
        return;
      }
      renderResult(result);
    }, 1800); // Simulate AI processing time
  }

  return { toggleSymptom, selectSymptom, run, reset, selectedSymptoms };
})();

// Global exposure for HTML onclick
function selectSymptom(s) { TriageAI.selectSymptom(s); }
