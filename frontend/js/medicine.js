/* =========================================================
   MediBuddy CareLink – Medicine Tracker
   ========================================================= */

const MedicineService = (function () {

  let medicines = [
    { id: 1, name: 'Metformin 500mg',   freq: 'Twice daily',      time: '08:00', notes: 'with food',    taken: true,  color: '#6C63FF' },
    { id: 2, name: 'Amlodipine 5mg',    freq: 'Once daily',       time: '14:00', notes: 'after lunch',  taken: false, color: '#00D4AA' },
    { id: 3, name: 'Atorvastatin 10mg', freq: 'Once daily',       time: '21:00', notes: 'before sleep', taken: false, color: '#FFB703' },
  ];

  const adherenceData = [
    { day: 'M', taken: true  },
    { day: 'T', taken: true  },
    { day: 'W', taken: false },
    { day: 'T', taken: true  },
    { day: 'F', taken: true  },
    { day: 'S', taken: true  },
    { day: 'S', taken: true  },
    { day: 'M', taken: false },
    { day: 'T', taken: true  },
    { day: 'W', taken: true  },
    { day: 'T', taken: true  },
    { day: 'F', taken: false },
    { day: 'S', taken: true  },
    { day: 'S', taken: true  },
  ];

  function render() {
    renderMedicineList();
    renderAdherenceChart();
  }

  function renderMedicineList() {
    const container = document.getElementById('medicines-list');
    if (!container) return;
    container.innerHTML = medicines.map(med => `
      <div class="medicine-card" id="med-card-${med.id}">
        <div class="mc-icon" style="font-size:2rem">💊</div>
        <div class="mc-info">
          <div class="mc-name">${med.name}</div>
          <div class="mc-sub">⏰ ${med.time} · ${med.freq}</div>
          <div class="mc-tags">
            <span class="mc-tag">${med.freq}</span>
            ${med.notes ? `<span class="mc-tag">${med.notes}</span>` : ''}
          </div>
        </div>
        <div class="mc-actions">
          <button class="mc-take-btn ${med.taken ? 'taken' : ''}"
            id="take-btn-${med.id}"
            onclick="MedicineService.markTaken(${med.id})">
            ${med.taken ? '✓ Taken' : 'Mark Taken'}
          </button>
          <button class="mc-skip-btn" onclick="MedicineService.skipDose(${med.id})">Skip</button>
        </div>
      </div>
    `).join('');
  }

  function renderAdherenceChart() {
    const container = document.getElementById('adherence-bars');
    if (!container) return;
    const maxHeight = 64;
    container.innerHTML = adherenceData.map(d => `
      <div class="adh-bar-wrap">
        <div class="adh-bar ${d.taken ? 'taken' : 'missed'}"
          style="height:${d.taken ? maxHeight : randInt(8, 20)}px"></div>
        <span class="adh-day">${d.day}</span>
      </div>
    `).join('');
  }

  function markTaken(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    med.taken = !med.taken;
    const btn = document.getElementById(`take-btn-${id}`);
    if (btn) {
      btn.textContent = med.taken ? '✓ Taken' : 'Mark Taken';
      btn.classList.toggle('taken', med.taken);
    }
    if (med.taken) {
      showToast(`✅ ${med.name} marked as taken!`, 'success');
      speak(`${med.name} dose recorded.`);
    }
  }

  function skipDose(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    showToast(`⚠️ ${med.name} dose skipped.`, 'warning');
  }

  function addMedicine() {
    const nameEl   = document.getElementById('med-name');
    const freqEl   = document.getElementById('med-freq');
    const timeEl   = document.getElementById('med-time');
    const notesEl  = document.getElementById('med-notes');

    const name = nameEl?.value.trim();
    if (!name) { showToast('Please enter medicine name.', 'warning'); return; }

    const newMed = {
      id:    medicines.length + 1,
      name,
      freq:  freqEl?.value  || 'Once daily',
      time:  timeEl?.value  || '08:00',
      notes: notesEl?.value || '',
      taken: false,
      color: '#6C63FF',
    };
    medicines.push(newMed);
    renderMedicineList();
    closeModal('add-medicine-modal');
    if (nameEl)  nameEl.value  = '';
    if (notesEl) notesEl.value = '';
    showToast(`✅ ${name} added to your medicines!`, 'success');
  }

  function openAddModal() {
    const modal = document.getElementById('add-medicine-modal');
    if (modal) modal.classList.remove('hidden');
  }

  return { render, markTaken, skipDose, addMedicine, openAddModal };
})();
