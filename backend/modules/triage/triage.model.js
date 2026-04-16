/**
 * Triage Session – MongoDB Model
 */
const mongoose = require('mongoose');

const triageLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId:    { type: String, required: true, index: true },
  symptoms:  [{ type: String }],
  age:       { type: Number },
  gender:    { type: String },
  severity:  { type: Number, min: 1, max: 10 },
  vitals: {
    heartRate:  Number,
    spO2:       Number,
    temperature: Number,
    bloodPressure: String,
  },
  result: {
    primary:  String,
    severity: { type: String, enum: ['green', 'yellow', 'red'] },
    confidence: Number,
    diseases: mongoose.Schema.Types.Mixed,
  },
  feedback: {
    accurate:        Boolean,
    actualDiagnosis: String,
  },
  language:  { type: String, default: 'en' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

triageLogSchema.index({ userId: 1, timestamp: -1 });
triageLogSchema.index({ 'result.severity': 1 });

module.exports = mongoose.model('TriageLog', triageLogSchema);
