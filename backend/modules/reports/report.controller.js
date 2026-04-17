/**
 * Reports Controller
 */
const { v4: uuidv4 } = require('uuid');
const db     = require('../../config/database');
const logger = require('../../config/logger');

exports.addReport = async (req, res) => {
  try {
    const { name, date, patientId } = req.body;
    const filePath = req.file ? req.file.path : null;
    const id = uuidv4();

    await db.query(
      `INSERT INTO medical_reports (id, user_id, report_name, report_date, file_path, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, patientId || req.user.userId, name, date, filePath]
    );

    res.status(201).json({ id, message: 'Report saved successfully' });
  } catch (err) {
    logger.error('addReport:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.userId;
    const result = await db.query(
      `SELECT * FROM medical_reports WHERE user_id = $1 ORDER BY report_date DESC`,
      [targetUserId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getReports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await db.query('DELETE FROM medical_reports WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    logger.error('deleteReport:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
