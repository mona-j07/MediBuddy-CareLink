/**
 * Reports Routes
 */
const express = require('express');
const router  = express.Router();
const controller = require('./report.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/add', authenticate, upload.single('report_file'), controller.addReport);
router.get('/', authenticate, controller.getReports);
router.delete('/:id', authenticate, controller.deleteReport);

module.exports = router;
