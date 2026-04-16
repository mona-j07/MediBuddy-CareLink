/* =========================================================
   MediBuddy CareLink – Community Health & Outbreak Module
   ========================================================= */

const CommunityService = (function () {

  const DISEASES = [
    { name: 'Dengue',     cases: 17, maxCases: 30, color: '#FF4D6D', trend: '↑' },
    { name: 'Malaria',    cases: 9,  maxCases: 30, color: '#FFB703', trend: '→' },
    { name: 'Diarrhea',   cases: 24, maxCases: 30, color: '#6C63FF', trend: '↑' },
    { name: 'TB',         cases: 4,  maxCases: 30, color: '#00D4AA', trend: '↓' },
    { name: 'Pneumonia',  cases: 6,  maxCases: 30, color: '#118AB2', trend: '→' },
  ];

  const OUTBREAKS = [
    { disease: 'Dengue',   area: 'Ward 4, Kalyanpur',      cases: 5,  status: 'active',   date: '2 days ago' },
    { disease: 'Diarrhea', area: 'Rampur Colony',           cases: 8,  status: 'active',   date: '4 days ago' },
    { disease: 'Malaria',  area: 'Lal Bagh, Sector 3',     cases: 3,  status: 'monitored', date: '1 week ago' },
  ];

  const DRIVES = [
    { icon: '💉', name: 'Polio Vaccination Drive',       date: 'Apr 20, 2026', location: 'PHC Kalyanpur', spots: 200 },
    { icon: '🩺', name: 'Free Health Camp – Diabetes',   date: 'Apr 25, 2026', location: 'Community Hall', spots: 150 },
    { icon: '🧪', name: 'Blood Donation Camp',           date: 'May 2, 2026',  location: 'District Hospital', spots: 100 },
    { icon: '🫀', name: 'Cardiac Screening Camp',        date: 'May 10, 2026', location: 'PHC Kalyanpur', spots: 80 },
  ];

  const CHW = [
    { name: 'Anita Devi',    area: 'Ward 1–4',    patients: 42, initial: 'A' },
    { name: 'Ramesh Yadav',  area: 'Ward 5–8',    patients: 38, initial: 'R' },
    { name: 'Lata Shukla',   area: 'Ward 9–12',   patients: 51, initial: 'L' },
    { name: 'Suresh Kumar',  area: 'Rampur Colony', patients: 29, initial: 'S' },
  ];

  function render() {
    renderDiseaseTracker();
    renderOutbreaks();
    renderDrives();
    renderCHW();
  }

  function renderDiseaseTracker() {
    const container = document.getElementById('disease-tracker');
    if (!container) return;
    container.innerHTML = DISEASES.map(d => `
      <div class="disease-row">
        <span class="disease-name">${d.name}</span>
        <div class="disease-bar">
          <div class="disease-bar-fill" style="width:${(d.cases / d.maxCases) * 100}%; background:${d.color}"></div>
        </div>
        <span class="disease-count">${d.cases}</span>
        <span style="font-size:0.75rem;color:${d.trend === '↑' ? 'var(--danger)' : d.trend === '↓' ? 'var(--success)' : 'var(--text-muted)'}">${d.trend}</span>
      </div>
    `).join('');
  }

  function renderOutbreaks() {
    const container = document.getElementById('outbreak-list');
    if (!container) return;
    container.innerHTML = OUTBREAKS.map(o => `
      <div class="outbreak-item">
        <div class="ob-dot"></div>
        <div style="flex:1">
          <strong style="font-size:0.88rem;color:var(--danger)">${o.disease} – ${o.area}</strong>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">
            ${o.cases} cases · Reported ${o.date}
          </div>
        </div>
        <span class="badge ${o.status === 'active' ? 'badge-danger' : 'badge-warning'}">
          ${o.status}
        </span>
      </div>
    `).join('');
  }

  function renderDrives() {
    const container = document.getElementById('drives-list');
    if (!container) return;
    container.innerHTML = DRIVES.map(d => `
      <div class="drive-item">
        <div class="drive-icon">${d.icon}</div>
        <div class="drive-info">
          <strong>${d.name}</strong>
          <small>📅 ${d.date} · 📍 ${d.location} · 👥 ${d.spots} spots</small>
        </div>
        <button class="nav-btn" onclick="showToast('✅ Registered for ${d.name}!', 'success')" style="font-size:0.75rem;padding:5px 10px">Register</button>
      </div>
    `).join('');
  }

  function renderCHW() {
    const container = document.getElementById('chw-list');
    if (!container) return;
    container.innerHTML = CHW.map(c => `
      <div class="chw-item">
        <div class="chw-avatar">${c.initial}</div>
        <div class="chw-info">
          <strong>${c.name}</strong>
          <small>${c.area} · ${c.patients} patients</small>
        </div>
        <span class="chw-stat">${c.patients} active</span>
      </div>
    `).join('');
  }

  return { render };
})();

/* =========================================================
   Family Hub Data
   ========================================================= */

const FamilyService = (function () {

  const FAMILY = [
    {
      name: 'Rajan Kumar',  rel: 'You (Elder)',  initial: 'R',
      age: 68, score: 82, color: '#6C63FF',
      conditions: ['Diabetes', 'Hypertension'],
      scoreColor: 'var(--success)',
    },
    {
      name: 'Sunita Kumar', rel: 'Wife',          initial: 'S',
      age: 63, score: 91, color: '#00D4AA',
      conditions: ['Arthritis'],
      scoreColor: 'var(--success)',
    },
    {
      name: 'Rahul Kumar',  rel: 'Son',           initial: 'R',
      age: 38, score: 95, color: '#FFB703',
      conditions: [],
      scoreColor: 'var(--success)',
    },
    {
      name: 'Priya Kumar',  rel: 'Daughter-in-law', initial: 'P',
      age: 34, score: 88, color: '#FF4D6D',
      conditions: [],
      scoreColor: 'var(--success)',
    },
    {
      name: 'Aryan Kumar',  rel: 'Grandson',      initial: 'A',
      age: 8,  score: 97, color: '#118AB2',
      conditions: [],
      scoreColor: 'var(--success)',
    },
  ];

  function render() {
    const grid = document.getElementById('family-grid');
    if (!grid) return;
    grid.innerHTML = FAMILY.map(f => `
      <div class="family-card" onclick="showToast('Opening ${f.name}\\\'s profile…', 'info')">
        <div class="family-card-header">
          <div class="family-avatar" style="background:linear-gradient(135deg,${f.color},${f.color}99)">
            ${f.initial}
          </div>
          <div>
            <div class="family-name">${f.name}</div>
            <div class="family-rel">${f.rel} · Age ${f.age}</div>
          </div>
        </div>
        ${f.conditions.length > 0 ? `
          <div class="family-health-row">
            ${f.conditions.map(c => `<span class="fh-tag">⚕️ ${c}</span>`).join('')}
          </div>
        ` : `<div style="font-size:0.78rem;color:var(--success)">✅ No active conditions</div>`}
        <div class="family-score-bar">
          <div class="bar-label"><span>Health Score</span><span style="color:${f.scoreColor}">${f.score}/100</span></div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${f.score}%;background:${f.scoreColor}"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  return { render };
})();

/* =========================================================
   Doctor Connect Data
   ========================================================= */

const DoctorService = (function () {

  const DOCTORS = [
    {
      name: 'Dr. Priya Sharma',   spec: 'General Physician',   emoji: '👩‍⚕️',
      rating: '⭐⭐⭐⭐⭐ 4.9', status: 'online',
      exp: '14 years', lang: 'Hindi, English, Telugu',
      fee: '₹150 / consultation', availability: 'Available now',
    },
    {
      name: 'Dr. Arvind Mehta',   spec: 'Cardiologist',         emoji: '👨‍⚕️',
      rating: '⭐⭐⭐⭐ 4.7', status: 'busy',
      exp: '22 years', lang: 'Hindi, English',
      fee: '₹300 / consultation', availability: 'Available in 30 min',
    },
    {
      name: 'Dr. Kavita Rao',     spec: 'Pediatrician',         emoji: '👩‍⚕️',
      rating: '⭐⭐⭐⭐⭐ 4.8', status: 'online',
      exp: '10 years', lang: 'Kannada, Tamil, English',
      fee: '₹200 / consultation', availability: 'Available now',
    },
    {
      name: 'Dr. Ramesh Gupta',   spec: 'Diabetologist',        emoji: '👨‍⚕️',
      rating: '⭐⭐⭐⭐ 4.6', status: 'offline',
      exp: '18 years', lang: 'Hindi, Marathi',
      fee: '₹250 / consultation', availability: 'Available tomorrow',
    },
    {
      name: 'Dr. Sonal Patel',    spec: 'Dermatologist',        emoji: '👩‍⚕️',
      rating: '⭐⭐⭐⭐⭐ 4.9', status: 'online',
      exp: '8 years', lang: 'Gujarati, English, Hindi',
      fee: '₹180 / consultation', availability: 'Available now',
    },
    {
      name: 'Dr. Kiran Kumar',    spec: 'ENT Specialist',       emoji: '👨‍⚕️',
      rating: '⭐⭐⭐⭐ 4.5', status: 'busy',
      exp: '12 years', lang: 'Telugu, Hindi, English',
      fee: '₹220 / consultation', availability: 'Available in 1 hour',
    },
  ];

  function render() {
    const grid = document.getElementById('doctors-grid');
    if (!grid) return;
    grid.innerHTML = DOCTORS.map(d => `
      <div class="doctor-card">
        <div class="doc-header">
          <div class="doc-avatar">${d.emoji}</div>
          <div>
            <div class="doc-name">${d.name}</div>
            <div class="doc-spec">${d.spec}</div>
            <div class="doc-rating">${d.rating}</div>
          </div>
          <span class="doc-status ${d.status}">${d.status === 'online' ? '● Online' : d.status === 'busy' ? '● Busy' : '○ Offline'}</span>
        </div>
        <div class="doc-info">
          <p>🎓 ${d.exp} experience</p>
          <p>🗣️ ${d.lang}</p>
          <p>💰 ${d.fee}</p>
          <p>⏰ ${d.availability}</p>
        </div>
        <div class="doc-actions">
          <button class="doc-video-btn" onclick="startVideoCall('${d.name}')">📹 Video Call</button>
          <button class="doc-chat-btn"  onclick="startChat('${d.name}')">💬 Chat</button>
        </div>
      </div>
    `).join('');
  }

  return { render };
})();

function startVideoCall(doctorName) {
  showToast(`📹 Connecting to ${doctorName} via WebRTC…`, 'info');
  speak(`Connecting to ${doctorName} for a video consultation.`);
}
function startChat(doctorName) {
  showToast(`💬 Opening chat with ${doctorName}…`, 'info');
}

/* =========================================================
   Health History Data
   ========================================================= */

const HistoryService = (function () {

  const TIMELINE = [
    {
      type: 'triage', icon: '🩺', title: 'AI Triage – Common Cold',
      meta: 'Today, 10:30 AM', detail: '🟢 Self-care · Confidence: 89%',
    },
    {
      type: 'consultation', icon: '👨‍⚕️', title: 'Dr. Priya Sharma – Video Consultation',
      meta: 'Yesterday, 4:00 PM · 12 minutes', detail: 'Discussed blood pressure management. Prescription renewed.',
    },
    {
      type: 'medicine', icon: '💊', title: 'Metformin 500mg – Added to tracker',
      meta: 'Apr 14, 2026', detail: 'Twice daily · with food · Prescribed by Dr. Gupta',
    },
    {
      type: 'lab', icon: '🧪', title: 'Lab Report – HbA1c & CBC',
      meta: 'Apr 14, 2026', detail: 'HbA1c: 7.2% (controlled) · Haemoglobin: 12.4 g/dL',
    },
    {
      type: 'triage', icon: '🩺', title: 'AI Triage – Joint Pain',
      meta: 'Apr 11, 2026', detail: '🟡 Clinic visit advised · Dengue follow-up',
    },
    {
      type: 'consultation', icon: '👨‍⚕️', title: 'Dr. Arvind Mehta – Cardiology Review',
      meta: 'Apr 8, 2026', detail: 'ECG normal. Blood pressure improved. Follow-up in 3 months.',
    },
    {
      type: 'lab', icon: '🧪', title: 'Lab Report – Lipid Profile',
      meta: 'Apr 5, 2026', detail: 'Total Cholesterol: 182 mg/dL · Triglycerides: 140 mg/dL',
    },
    {
      type: 'medicine', icon: '💊', title: 'Atorvastatin 10mg – Dose adjusted',
      meta: 'Apr 3, 2026', detail: 'Dose increased from 5mg to 10mg as per Dr. Mehta',
    },
  ];

  function render(filter = 'all') {
    const container = document.getElementById('health-timeline');
    if (!container) return;
    const items = filter === 'all' ? TIMELINE : TIMELINE.filter(t => t.type === filter);
    container.innerHTML = items.map(item => `
      <div class="timeline-item">
        <div class="timeline-dot ${item.type}">${item.icon}</div>
        <div class="timeline-body">
          <div class="timeline-title">${item.title}</div>
          <div class="timeline-meta">📅 ${item.meta}</div>
          <div class="timeline-detail">${item.detail}</div>
        </div>
      </div>
    `).join('');
  }

  return { render };
})();
