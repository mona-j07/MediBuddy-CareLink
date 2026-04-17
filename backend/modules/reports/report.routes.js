/**
 * Reports Routes
 */
const express = require('express');
const router  = express.Router();
const controller = require('./report.controller');
const auth = require('../../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/add', auth, upload.single('report_file'), controller.addReport);
router.get('/', auth, controller.getReports);
router.delete('/:id', auth, controller.deleteReport);

module.exports = router;
