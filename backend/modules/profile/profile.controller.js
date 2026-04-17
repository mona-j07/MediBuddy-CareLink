/**
 * Profile Controller
 */
const db = require('../../config/database');
const logger = require('../../config/logger');

exports.getProfile = async (req, res) => {
  try {
    const user = await db.query('SELECT id, name, phone, role, language, age, gender, specialization FROM users WHERE id = $1', [req.user.userId]);
    res.json(user.rows[0]);
  } catch (err) {
    logger.error('getProfile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, language, age, gender, specialization } = req.body;
    await db.query(
      `UPDATE users 
       SET name = $1, phone = $2, language = $3, age = $4, gender = $5, specialization = $6, updated_at = NOW()
       WHERE id = $7`,
      [name, phone, language, age, gender, specialization, req.user.userId]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    logger.error('updateProfile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
