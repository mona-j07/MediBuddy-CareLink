/**
 * Doctor Controller
 */
const doctorService = require('../services/doctorService');
const logger = require('../config/logger');

const getNearbyDoctors = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  try {
    const doctors = await doctorService.getNearbyDoctors(parseFloat(lat), parseFloat(lng));
    
    if (doctors.length === 0) {
      return res.json({ doctors: [], message: 'No doctors available in your area' });
    }

    res.json({ doctors });
  } catch (error) {
    logger.error('Error in getNearbyDoctors controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.addDoctor(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    logger.error('Error adding doctor:', error);
    res.status(500).json({ error: 'Failed to add doctor' });
  }
};

module.exports = {
  getNearbyDoctors,
  addDoctor
};
