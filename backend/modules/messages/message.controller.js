/**
 * Message Controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const logger = require('../../config/logger');

exports.getMessages = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows);
  } catch (err) {
    logger.error('getMessages:', err);
    res.status(500).json({ error: 'Failed to fetch message logs' });
  }
};

exports.logMessage = async (req, res) => {
  try {
    const { receiver, message_text, sender } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO messages (id, user_id, sender, receiver, message_text) VALUES ($1, $2, $3, $4, $5)',
      [id, req.user.userId, sender || 'System', receiver, message_text]
    );
    res.status(201).json({ id, message: 'Message logged' });
  } catch (err) {
    logger.error('logMessage:', err);
    res.status(500).json({ error: 'Failed to log message' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    await db.query('DELETE FROM messages WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Message record deleted' });
  } catch (err) {
    logger.error('deleteMessage:', err);
    res.status(500).json({ error: 'Failed to delete message record' });
  }
};
