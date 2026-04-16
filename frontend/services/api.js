/**
 * API Service
 * Centralized API calls for the frontend.
 */
// Change this to your live Render backend URL when deploying (e.g., https://medibuddy-backend.onrender.com/api)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? '/api' 
  : 'https://medibuddy-carelink-backend.onrender.com/api'; 

const api = {
  async get(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  async post(endpoint, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async sendVoiceCommand(text) {
    return this.post('/voice/command', { text });
  },

  async getNearbyDoctors(lat, lng) {
    return this.get(`/doctors/nearby?lat=${lat}&lng=${lng}`);
  }
};

export default api;
