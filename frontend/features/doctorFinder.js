/**
 * Doctor Finder Feature
 * Handles the display of doctors from the database.
 */
import api from '../services/api.js';

export const showDoctorsUI = (doctors) => {
  const container = document.getElementById('doctor-finder-results') || createDoctorContainer();
  container.innerHTML = '';

  if (!doctors || doctors.length === 0) {
    container.innerHTML = '<div class="no-doctors">No doctors available in your area</div>';
    return;
  }

  doctors.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.innerHTML = `
      <div class="doc-info">
        <h3>${doc.name}</h3>
        <p>${doc.specialization}</p>
        <span class="distance">📍 ${doc.distance}</span>
      </div>
      <div class="doc-actions">
        <button class="call-btn" onclick="window.location.href='tel:${doc.phone}'">📞 Call</button>
        <span class="status ${doc.availability_status ? 'available' : 'busy'}">
          ${doc.availability_status ? 'Available' : 'Busy'}
        </span>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Slide up or show the container
  container.classList.add('active');
};

const createDoctorContainer = () => {
  const div = document.createElement('div');
  div.id = 'doctor-finder-results';
  div.className = 'doctor-finder-panel';
  document.body.appendChild(div);
  return div;
};

// Global expose for voice service
window.showDoctorsUI = showDoctorsUI;
