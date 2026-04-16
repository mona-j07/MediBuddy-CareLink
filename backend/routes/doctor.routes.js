/**
 * Doctor Routes
 */
const router = require('express').Router();
const doctorController = require('../controllers/doctorController');
const verifyToken = require('../middleware/authMiddleware');
const verifyRole = require('../middleware/roleMiddleware');

// Get nearby doctors (Anyone authenticated)
router.get('/nearby', verifyToken, doctorController.getNearbyDoctors);

// Admin / Backend-controlled doctor management
router.post('/add-doctor', verifyToken, verifyRole(['admin']), doctorController.addDoctor);

module.exports = router;
