/**
 * Doctor Model
 */
const db = require('../config/database');

class Doctor {
  static async findAll() {
    const result = await db.query('SELECT * FROM doctors ORDER BY created_at DESC');
    return result.rows;
  }

  static async findNearby(lat, lng) {
    // This is handled by doctorService, but we can put the raw DB query here if preferred.
    // However, keeping it in service for the Haversine calculation is cleaner for now.
    const result = await db.query('SELECT * FROM doctors WHERE availability_status = true');
    return result.rows;
  }

  static async create(doctorData) {
    const { name, specialization, hospital_name, latitude, longitude, phone } = doctorData;
    const result = await db.query(
      `INSERT INTO doctors (name, specialization, hospital_name, latitude, longitude, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, specialization, hospital_name, latitude, longitude, phone]
    );
    return result.rows[0];
  }
}

module.exports = Doctor;
