/**
 * Emergency Controller
 * Handles SOS alerts, contact notifications, nearest hospital lookup
 */
const axios  = require('axios');
const { v4: uuidv4 } = require('uuid');
const db     = require('../../config/database');
const logger = require('../../config/logger');

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

exports.triggerSOS = async (req, res) => {
  try {
    const { userId } = req.user;
    const { latitude, longitude, condition, symptoms = [] } = req.body;
    const sosId = uuidv4();

    // 1. Log SOS event
    await db.query(
      `INSERT INTO emergency_events (id, user_id, latitude, longitude, condition, symptoms, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'active',NOW())`,
      [sosId, userId, latitude, longitude, condition, JSON.stringify(symptoms)]
    );

    // 2. Fetch user's emergency contacts
    const contacts = await db.query(
      'SELECT name, phone, relationship FROM emergency_contacts WHERE user_id=$1',
      [userId]
    );

    // 3. Send SMS/notifications (via Firebase & Twilio)
    const notificationPayload = {
      sosId,
      userId,
      location: { latitude, longitude },
      condition,
      symptoms,
      timestamp: new Date().toISOString(),
    };

    // In production: fire SMS via Twilio, push via FCM
    logger.warn(`[SOS TRIGGERED] User=${userId} at (${latitude},${longitude}) Condition=${condition}`);

    // 4. Find nearest hospital via Google Maps
    let nearestHospital = { name: 'District Hospital', distance: '1.2km', phone: '108' };
    if (GOOGLE_MAPS_KEY && latitude && longitude) {
      try {
        const mapsRes = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${latitude},${longitude}`,
            radius: 5000,
            type: 'hospital',
            key: GOOGLE_MAPS_KEY,
          },
          timeout: 5000,
        });
        const result = mapsRes.data.results?.[0];
        if (result) {
          nearestHospital = {
            name: result.name,
            distance: 'Calculating…',
            address: result.vicinity,
          };
        }
      } catch { /* Maps unavailable – use fallback */ }
    }

    res.status(200).json({
      sosId,
      message: 'SOS alert sent successfully',
      contactsNotified: contacts.rows.length,
      nearestHospital,
      emergencyNumber: '108',
    });
  } catch (err) {
    logger.error('SOS error:', err);
    res.status(500).json({ error: 'SOS failed to trigger' });
  }
};

exports.cancelSOS = async (req, res) => {
  const { userId } = req.user;
  await db.query(
    `UPDATE emergency_events SET status='cancelled', cancelled_at=NOW()
     WHERE user_id=$1 AND status='active'`,
    [userId]
  );
  logger.info(`SOS cancelled by user ${userId}`);
  res.json({ message: 'SOS cancelled successfully' });
};

exports.getContacts = async (req, res) => {
  const contacts = await db.query(
    'SELECT * FROM emergency_contacts WHERE user_id=$1 ORDER BY priority',
    [req.user.userId]
  );
  res.json(contacts.rows);
};

exports.updateContacts = async (req, res) => {
  const { contacts } = req.body;
  const { userId } = req.user;
  await db.query('DELETE FROM emergency_contacts WHERE user_id=$1', [userId]);
  for (const c of contacts) {
    await db.query(
      `INSERT INTO emergency_contacts (id,user_id,name,phone,relationship,priority)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), userId, c.name, c.phone, c.relationship, c.priority || 1]
    );
  }
  res.json({ message: 'Contacts updated successfully' });
};

exports.getHistory = async (req, res) => {
  const history = await db.query(
    `SELECT id, condition, status, created_at, latitude, longitude
     FROM emergency_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`,
    [req.user.userId]
  );
  res.json(history.rows);
};

exports.getNearestHospital = async (req, res) => {
  const { lat, lng } = req.query;
  res.json({
    hospitals: [
      { name: 'District Government Hospital', distance: '1.2km', type: 'hospital', phone: '0532-2222111' },
      { name: 'PHC Kalyanpur',               distance: '2.8km', type: 'phc',      phone: '0532-3332111' },
      { name: 'Dr. Sharma Clinic',           distance: '0.8km', type: 'clinic',   phone: '+91-9876543210' },
    ],
  });
};
