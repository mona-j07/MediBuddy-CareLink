/**
 * Voice Service
 * Handles real-time voice interaction using Web Speech API.
 * Triggers backend APIs and executes UI updates.
 */
import api from './api.js';

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true; // Show results immediately
    this.recognition.lang = localStorage.getItem('user_language') || 'en-US';

    this.recognition.onresult = async (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (this.onResultCallback) {
        this.onResultCallback(finalTranscript || interimTranscript, !!finalTranscript);
      }

      // If we have a final transcript, send to backend
      if (finalTranscript) {
        console.log('Final Voice Captured:', finalTranscript.trim());
        const response = await api.sendVoiceCommand(finalTranscript.trim());
        this.handleBackendResponse(response);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we are still supposed to be listening
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };
  }

  start() {
    if (!this.recognition) return;
    this.isListening = true;
    this.recognition.start();
    console.log('Voice interaction started...');
  }

  stop() {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.stop();
  }

  handleBackendResponse(response) {
    const { intent, action, data } = response;
    console.log('Backend Response:', response);

    switch (action) {
      case 'NAVIGATE_TRIAGE':
        window.location.hash = '#triage';
        // Auto-fill symptoms if provided
        if (data.symptoms) {
          localStorage.setItem('pending_symptoms', JSON.stringify(data.symptoms));
        }
        break;

      case 'UPDATE_UI_LANGUAGE':
        localStorage.setItem('user_language', data.language);
        if (this.recognition) this.recognition.lang = data.language;
        alert(data.message || `Language switched to ${data.language}`);
        window.location.reload();
        break;

      case 'TRIGGER_SOS':
        // Call emergency function
        if (window.triggerEmergency) window.triggerEmergency(data.severity);
        // Show nearby doctors immediately during emergency
        this.fetchAndShowDoctors();
        break;

      case 'GET_NEARBY_DOCTORS':
        this.fetchAndShowDoctors();
        break;
      
      case 'POST_MEDICINE':
        this.addMedicineByVoice(data);
        break;

      default:
        this.speak("I'm not sure how to help with that. Could you please repeat?");
        break;
    }
  }

  async fetchAndShowDoctors() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const result = await api.getNearbyDoctors(latitude, longitude);
      
      if (window.showDoctorsUI) {
        window.showDoctorsUI(result.doctors);
      } else {
        console.log('Doctors found:', result.doctors);
      }
    });
  }

  async addMedicineByVoice(data) {
    try {
      this.speak(`Adding ${data.name}, ${data.dosage} at ${data.time}`);
      const result = await api.post('/medicine/add', {
        name: data.name,
        dosage: data.dosage,
        times: [data.time]
      });
      console.log('Medicine Added:', result);
      this.speak("Medicine added successfully.");
      // Refresh UI if on medicine view
      if (window.location.hash === '#medicine') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add medicine by voice:', error);
      this.speak("I couldn't add the medicine. Please try again.");
    }
  }

  speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = localStorage.getItem('user_language') || 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

export default new VoiceService();
