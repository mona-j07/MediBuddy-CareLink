/**
 * Doctor Service
 * Strictly DB-driven logic for doctor management and location-based search.
 */
const db = require('../config/database');
const logger = require('../config/logger');

class DoctorService {
  /**
   * Calculates distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get doctors near a location
   */
  async getNearbyDoctors(lat, lng, limit = 3) {
    try {
      const result = await db.query('SELECT * FROM doctors WHERE availability_status = true');
      const allDoctors = result.rows;

      const nearbyDoctors = allDoctors.map(doctor => {
        const distance = this.calculateDistance(lat, lng, doctor.latitude, doctor.longitude);
        return {
          ...doctor,
          distance: distance.toFixed(1) + ' km',
          distanceVal: distance
        };
      });

      // Sort by distance and take top 3
      return nearbyDoctors
        .sort((a, b) => a.distanceVal - b.distanceVal)
        .slice(0, limit);
    } catch (err) {
      logger.error('Error fetching nearby doctors:', err);
      throw err;
    }
  }

  /**
   * Add a new doctor (Admin)
   */
  async addDoctor(doctorData) {
    const { name, specialization, hospital_name, latitude, longitude, phone } = doctorData;
    const query = `
      INSERT INTO doctors (name, specialization, hospital_name, latitude, longitude, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [name, specialization, hospital_name, latitude, longitude, phone];
    const result = await db.query(query, params);
    return result.rows[0];
  }
}

module.exports = new DoctorService();
