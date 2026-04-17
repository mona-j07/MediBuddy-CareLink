// Messaging Module (Chat + SMS alerts)
const router = require('express').Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');

router.get('/conversations', authenticate, async (req, res) => {
  const convs = await db.query(
    `SELECT c.*, u.name as other_name, u.role as other_role,
       (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY sent_at DESC LIMIT 1) AS last_message
     FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id=c.id
     JOIN users u ON u.id = (SELECT member_id FROM conversation_members WHERE conversation_id=c.id AND member_id!=$1 LIMIT 1)
     WHERE cm.member_id=$1 ORDER BY c.updated_at DESC`,
    [req.user.id]
  );
  res.json(convs.rows);
});

router.get('/:conversationId/messages', authenticate, async (req, res) => {
  const msgs = await db.query(
    `SELECT m.*, u.name AS sender_name FROM messages m
     JOIN users u ON u.id=m.sender_id
     WHERE m.conversation_id=$1 ORDER BY m.sent_at ASC LIMIT 50`,
    [req.params.conversationId]
  );
  res.json(msgs.rows);
});

router.post('/send', authenticate, async (req, res) => {
  const { toUserId, content, type = 'text', conversationId } = req.body;
  const msgId = uuidv4();
  let convId = conversationId;

  if (!convId) {
    const conv = await db.query(
      'INSERT INTO conversations (id, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
      [uuidv4()]
    );
    convId = conv.rows[0].id;
    await db.query(
      'INSERT INTO conversation_members (conversation_id, member_id) VALUES ($1,$2),($1,$3)',
      [convId, req.user.id, toUserId]
    );
  }

  await db.query(
    'INSERT INTO messages (id,conversation_id,sender_id,content,type,sent_at) VALUES ($1,$2,$3,$4,$5,NOW())',
    [msgId, convId, req.user.id, content, type]
  );
  res.status(201).json({ messageId: msgId, conversationId: convId });
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM messages WHERE id=$1 AND sender_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
