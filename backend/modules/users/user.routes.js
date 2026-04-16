// Users Module
const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const db = require('../../config/database');

router.get('/me', authenticate, async (req, res) => {
  const user = await db.query(
    'SELECT id,name,phone,role,language,age,gender,village_id,created_at FROM users WHERE id=$1',
    [req.user.id]
  );
  res.json(user.rows[0] || {});
});

router.put('/me', authenticate, async (req, res) => {
  const { name, language, age, gender } = req.body;
  await db.query(
    'UPDATE users SET name=$1,language=$2,age=$3,gender=$4,updated_at=NOW() WHERE id=$5',
    [name, language, age, gender, req.user.id]
  );
  res.json({ message: 'Profile updated' });
});

router.get('/family', authenticate, async (req, res) => {
  const family = await db.query(
    'SELECT * FROM family_links WHERE primary_user_id=$1', [req.user.id]
  );
  res.json(family.rows);
});

router.post('/family', authenticate, async (req, res) => {
  const { memberId, relationship } = req.body;
  await db.query(
    `INSERT INTO family_links (primary_user_id, member_id, relationship) VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [req.user.id, memberId, relationship]
  );
  res.status(201).json({ message: 'Family member linked' });
});

router.get('/health-score', authenticate, async (req, res) => {
  const score = await db.query(
    'SELECT score, factors FROM health_scores WHERE user_id=$1 ORDER BY calculated_at DESC LIMIT 1',
    [req.user.id]
  );
  res.json(score.rows[0] || { score: 75, factors: {} });
});

module.exports = router;
