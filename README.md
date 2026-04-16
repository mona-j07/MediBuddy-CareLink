# 🏥 MediBuddy CareLink – Voice AI Rural & Elder Healthcare Platform

**"When a patient speaks, healthcare responds instantly."**

MediBuddy CareLink is a full-stack, voice-first digital health platform tailored for the elderly and rural populations. It bypasses traditional literacy barriers by allowing users to interact with the entire healthcare ecosystem purely through vernacular voice commands, supported by highly visual, elder-friendly UI components.

---

## 🔥 Key System Capabilities

1. **Voice-First AI Assistant**: Process natural language locally/remotely to trigger system events (e.g., "I have a fever and headache" → Auto-launches AI Triage).
2. **AI Symptom Triage**: Employs ML models (Python/FastAPI) to predict diseases, output confidence scores, specify severity (Green/Yellow/Red), and provide instant first-aid.
3. **Emergency SOS System**: One-tap/voice-activated alerting that instantly shares GPS location with trusted contacts and nearest hospitals.
4. **Community Outbreak Radar**: Aggregates local symptom data from Community Health Workers (CHWs) to detect biological clusters and predict outbreaks.
5. **Medicine Tracker**: Voice-integrated pill reminder and adherence charting.
6. **Family & Doctor Hub**: Links multi-generational user profiles and offers ultra-low latency WebRTC Telemedicine connects.

---

## 🏗️ System Architecture

* **Frontend**: Vanilla HTML/JS/CSS (Voice-First, Mobile-Responsive PWA, pure CSS tokens). No heavy frameworks for maximum speed in low-bandwidth rural areas.
* **Backend API Gateway**: Node.js & Express — Orchestrates auth, websockets, and external APIs.
* **AI Engine Microservice**: Python & FastAPI — Handles Speech-to-Text (Whisper), Text-to-Speech (gTTS), and the core ML Triage Algorithm.
* **Database Layer**:
  * **PostgreSQL**: Structured transactional data (Profiles, Medicines, SOS events, CHW metrics).
  * **MongoDB**: Unstructured, high-volume data (Triage session logs, raw AI analytics).
* **Infrastructure**: Dockerized multi-container setup (Node, Python, Postgres, Mongo, Redis).

---

## 📁 Repository Structure

```text
MEDIBUDDY RURAL/
├── frontend/                 # Voice-First Vanilla JS Web Client
│   ├── index.html            # Main SPA wrapper
│   ├── css/                  # Design tokens, components, grid system
│   └── js/                   # Modular controllers (app, voice, triage, medicine...)
├── backend/                  # Node.js API Gateway (Express)
│   ├── server.js             # Entry point & WebSockets
│   ├── modules/              # Domain-driven backend modules (REST)
│   ├── config/               # DB & Logger setup
│   └── middleware/           # Auth & Validator
├── ai/                       # Python FastAPI AI Microservice
│   ├── main.py               # AI Triage, STT, TTS endpoints
│   └── requirements.txt      
├── database/
│   └── postgres/init.sql     # Global relational schema
├── docker-compose.yml        # Multi-container orchestration
└── .env.example              # Environment variables template
```

---

## 🚀 Quickstart Guide (Local Development)

### 1. Requirements
* Docker & Docker Compose
* Node.js (v18+)
* Python (3.9+)

### 2. Boot the Backend & Infrastructure
The easiest way to start the entire backend stack (Node API, Python AI Service, Postgres cluster, MongoDB, Redis) is via Docker Compose:

```bash
docker-compose up --build
```

**Services Exposed:**
* Node.js Backend API: `http://localhost:4000`
* Python AI Service: `http://localhost:8000`
* PostgreSQL: `localhost:5432`
* MongoDB: `localhost:27017`

### 3. Run the Frontend Client
Since the frontend is built entirely using vanilla web technologies, you simply need a static HTTP server to serve the `frontend` directory.

```bash
cd frontend
npx serve . -l 5500
```
Open `http://localhost:5500` in your web browser. 

*Note: For the Web Speech AI API (microphone) to work, it must be run on `localhost` or served over `HTTPS`.*

---

## 🎤 Voice Engine Demo Instructions
When you launch the frontend:
1. Allow Microphone Permissions.
2. Click the floating **Microphone FAB** at the bottom right.
3. Say: **"I have fever and severe headache"** → *Watch the AI Triage panel open up completely automatically with the symptoms extracted!*
4. Say: **"Show my medicines"** → *Watch the medicine tracker pop up.*
5. Say: **"Emergency help"** → *Triggers the SOS protocol.*

---

## 🛠 Active Technologies Used
* **UI/UX**: HTML5, Vanilla JavaScript, CSS3 Variables, Glassmorphism, CSS Grid/Flexbox
* **Voice**: Web Speech API (`webkitSpeechRecognition`), Google Text-to-Speech (gTTS)
* **API Frameworks**: Express.js (Node), FastAPI (Python)
* **Data Storage**: PostgreSQL, MongoDB 6.0, Redis 7 (Sockets/Caching)
* **Real-time Engine**: Socket.io
* **Containerization**: Docker Compose

*Designed exclusively for the rural & elderly use-case context for real impact.*
