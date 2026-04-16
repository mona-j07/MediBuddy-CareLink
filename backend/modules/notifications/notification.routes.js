// Notifications Module
const router = require('express').Router();
const { authenticate } = require('../../middleware/auth.middleware');
const db = require('../../config/database');

router.get('/', authenticate, async (req, res) => {
  const limit = req.query.limit || 20;
  const notifs = await db.query(
    'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2',
    [req.user.id, limit]
  );
  res.json(notifs.rows);
});

router.put('/:id/read', authenticate, async (req, res) => {
  await db.query(
    'UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Notification marked as read' });
});

router.put('/read-all', authenticate, async (req, res) => {
  await db.query(
    'UPDATE notifications SET read=TRUE WHERE user_id=$1 AND read=FALSE',
    [req.user.id]
  );
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
