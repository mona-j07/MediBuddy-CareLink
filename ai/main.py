import os
import random
from io import BytesIO
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from gtts import gTTS
from fastapi.responses import StreamingResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MediBuddy CareLink - AI Engine", version="1.0.0")

class TriageRequest(BaseModel):
    symptoms: List[str]
    age: Optional[int] = 55
    gender: Optional[str] = "other"
    severity: Optional[int] = 5
    vitals: Optional[Dict[str, Any]] = {}

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

# --- Disease Knowledge Base (Simulated ML Model weights) ---
DISEASES = [
    {"name": "Common Cold / Flu", "symptoms": ["fever", "headache", "cough", "fatigue", "nausea"], "severity": "green", "advice": ["Rest and hydrate", "Take paracetamol for fever if > 100", "Gargle with warm salt water"]},
    {"name": "Dengue Fever", "symptoms": ["fever", "headache", "joint_pain", "rash", "eye_pain", "fatigue"], "severity": "yellow", "advice": ["Seek medical evaluation immediately", "Stay well-hydrated with ORS", "Do NOT take Aspirin or Ibuprofen"]},
    {"name": "Gastroenteritis", "symptoms": ["stomachache", "vomiting", "diarrhea", "nausea", "fever"], "severity": "yellow", "advice": ["Drink ORS frequently", "Eat light foods (BRAT diet)", "If vomiting persists > 24 hours, visit clinic"]},
    {"name": "Cardiac Emergency", "symptoms": ["chest_pain", "breathlessness", "fatigue", "dizziness", "nausea"], "severity": "red", "advice": ["CALL EMERGENCY SERVICES IMMEDIATELY", "Sit down comfortably", "Loosen tight clothing"]},
    {"name": "Respiratory Infection", "symptoms": ["cough", "fever", "breathlessness", "fatigue", "chest_pain"], "severity": "yellow", "advice": ["Steam inhalation", "Drink warm liquids", "Visit clinic if breathing difficulty increases"]},
    {"name": "Migraine", "symptoms": ["headache", "nausea", "dizziness", "fatigue", "eye_pain"], "severity": "green", "advice": ["Rest in a dark, quiet room", "Apply cold or warm compress to head/neck", "Take prescribed medication"]},
    {"name": "Stroke (Neurological)", "symptoms": ["dizziness", "headache", "vomiting", "back_pain"], "severity": "red", "advice": ["CALL 108 IMMEDIATELY", "Use FAST test: Face drooping, Arm weakness, Speech", "Do NOT give food or water"]},
]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "MediBuddy AI Engine"}

@app.post("/triage")
def perform_triage(data: TriageRequest):
    """
    Advanced triage analysis (simulating an ML model inference).
    """
    logger.info(f"Triage requested for symptoms: {data.symptoms}")
    
    if not data.symptoms:
        return {"diseases": []}

    scored_diseases = []
    user_symptoms = set(data.symptoms)

    for d in DISEASES:
        disease_symptoms = set(d["symptoms"])
        overlap = len(user_symptoms.intersection(disease_symptoms))
        if overlap == 0:
            continue
            
        # Calculate jaccard-like similarity + base threshold
        total = max(len(disease_symptoms), len(user_symptoms))
        base_probability = overlap / total

        # Feature engineering weights
        if data.age and data.age > 60:
             if d["name"] in ["Cardiac Emergency", "Stroke (Neurological)"]:
                 base_probability *= 1.4
             if d["name"] in ["Dengue Fever", "Respiratory Infection"]:
                 base_probability *= 1.2
                 
        if data.severity:
             if data.severity >= 8:
                 base_probability *= 1.25
             elif data.severity <= 3:
                 base_probability *= 0.8
                 
        prob = round(min(0.97, base_probability), 2)
        if prob > 0.1:
             scored_diseases.append({
                 "name": d["name"],
                 "probability": prob,
                 "severity": d["severity"],
                 "advice": d["advice"]
             })
             
    # Sort by probability
    scored_diseases.sort(key=lambda x: x["probability"], reverse=True)
    
    return {"diseases": scored_diseases[:3]}

@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...), language: str = Form("en")):
    """
    Simulates Whisper API for Speech-to-Text.
    In a real-world scenario, this would load whisper model or call OpenAI API.
    """
    logger.info(f"Processing audio file: {audio.filename} with lang: {language}")
    content = await audio.read()
    
    # Simulate transcription processing time & fallback response
    # Real implementation:
    # model = whisper.load_model("base")
    # result = model.transcribe("temp_audio_file.wav", language=language)
    
    # We return a dummy matched string based on file name or random selection to emulate STT
    simulated_texts = [
        "I have a fever and headache since morning",
        "It is very painful in my chest and I feel breathless",
        "Show my medicines",
        "Please call the nearest doctor immediately"
    ]
    
    import time
    time.sleep(1) # simulate processing latency
    
    result_text = random.choice(simulated_texts)
    return {"text": result_text, "language": language, "model": "whisper-simulated"}

@app.post("/text-to-speech")
def text_to_speech(data: TTSRequest):
    """
    Generate audio from text using Google TTS natively.
    """
    try:
        logger.info(f"TTS requested: '{data.text}' in lang '{data.language}'")
        # Match language codes expected by gTTS
        lang_map = {'en': 'en', 'hi': 'hi', 'ta': 'ta', 'te': 'te', 'kn': 'kn', 'mr': 'mr'}
        gtts_lang = lang_map.get(data.language[:2].lower(), 'en')
        
        tts = gTTS(text=data.text, lang=gtts_lang, slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return StreamingResponse(fp, media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")

if __name__ == "__main__":
    import uvicorn
    # Make sure to run exactly as defined
    uvicorn.run(app, host="0.0.0.0", port=8000)
