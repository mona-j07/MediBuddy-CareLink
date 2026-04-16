/**
 * DB Adapter – File-backed in-memory store
 * Works WITHOUT PostgreSQL. Persists to JSON files.
 * Same interface as pg.query() where possible.
 */
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class Collection {
  constructor(name, seed = []) {
    this.name = name;
    this.file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.file)) {
      this.data = seed.map((r, i) => ({ ...r, id: r.id || `${name}_${i + 1}`, created_at: new Date().toISOString() }));
      this._save();
    } else {
      this.data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    }
  }

  _save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  findAll(filter = null) {
    if (!filter) return [...this.data];
    return this.data.filter(r =>
      Object.entries(filter).every(([k, v]) => r[k] === v)
    );
  }

  findById(id) {
    return this.data.find(r => String(r.id) === String(id)) || null;
  }

  findOne(filter) {
    return this.data.find(r => Object.entries(filter).every(([k, v]) => r[k] === v)) || null;
  }

  insert(record) {
    const id = record.id || `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newRecord = { ...record, id, created_at: new Date().toISOString() };
    this.data.push(newRecord);
    this._save();
    return newRecord;
  }

  update(id, changes) {
    const idx = this.data.findIndex(r => String(r.id) === String(id));
    if (idx === -1) return null;
    this.data[idx] = { ...this.data[idx], ...changes, updated_at: new Date().toISOString() };
    this._save();
    return this.data[idx];
  }

  updateWhere(filter, changes) {
    let count = 0;
    this.data = this.data.map(r => {
      if (Object.entries(filter).every(([k, v]) => r[k] === v)) {
        count++;
        return { ...r, ...changes, updated_at: new Date().toISOString() };
      }
      return r;
    });
    this._save();
    return count;
  }

  delete(id) {
    const before = this.data.length;
    this.data = this.data.filter(r => String(r.id) !== String(id));
    if (this.data.length !== before) { this._save(); return true; }
    return false;
  }

  count(filter = null) {
    return this.findAll(filter).length;
  }
}

// ── Seed data ──────────────────────────────────────────────────────────
const DOCTOR_SEED = [
  { id: 'doc_001', name: 'Dr. Ramesh Kumar',     specialization: 'General Physician', hospital_name: 'Apollo Hospitals, Chennai',         latitude: 13.0827, longitude: 80.2707, availability_status: true,  phone: '+91-9344667788', rating: 4.8, bio: 'MBBS, MD – 15 yrs general medicine',     languages: ['en','ta','hi'] },
  { id: 'doc_002', name: 'Dr. Priya Nair',        specialization: 'Pediatrics',        hospital_name: 'Fortis Malar Hospital, Chennai',    latitude: 13.0050, longitude: 80.2575, availability_status: true,  phone: '+91-9344112233', rating: 4.7, bio: 'MBBS, DCH – Child specialist 10 yrs',     languages: ['en','ta','ml'] },
  { id: 'doc_003', name: 'Dr. Vijay Singh',       specialization: 'Cardiology',        hospital_name: 'KGMU, Lucknow',                     latitude: 26.8467, longitude: 80.9462, availability_status: false, phone: '+91-9876543210', rating: 4.9, bio: 'MD, DM Cardiology – 20 yrs cardiac care', languages: ['en','hi']     },
  { id: 'doc_004', name: 'Dr. Annapoorna Devi',   specialization: 'Gynecology',        hospital_name: 'Sanjay Gandhi Hospital, Lucknow',   latitude: 26.8183, longitude: 80.9395, availability_status: true,  phone: '+91-9876100200', rating: 4.6, bio: 'MBBS, MS Gynecology – Maternal health',   languages: ['en','hi','ur'] },
  { id: 'doc_005', name: 'Dr. Mohammed Salim',    specialization: 'Dermatology',       hospital_name: 'Mehta Hospital, Chennai',            latitude: 13.0604, longitude: 80.2496, availability_status: true,  phone: '+91-9944332211', rating: 4.5, bio: 'MBBS, MD Dermatology – Skin specialist',  languages: ['en','ta','ur'] },
  { id: 'doc_006', name: 'Dr. Lakshmi Venkat',    specialization: 'Neurology',         hospital_name: 'Sri Ramachandra Hospital, Chennai', latitude: 13.0358, longitude: 80.1771, availability_status: true,  phone: '+91-9344551122', rating: 4.8, bio: 'MBBS, DM Neurology – Brain specialist',   languages: ['en','ta']     },
];

// ── Collections (singletons) ───────────────────────────────────────────
const doctors      = new Collection('doctors',      DOCTOR_SEED);
const voiceLogs    = new Collection('voice_logs',   []);
const users        = new Collection('users',        []);
const consultations = new Collection('consultations', []);

module.exports = { Collection, doctors, voiceLogs, users, consultations };
