/**
 * Medicine Controller
 */
const { v4: uuidv4 } = require('uuid');
const db     = require('../../config/database');
const logger = require('../../config/logger');

exports.getMedicines = async (req, res) => {
  try {
    const meds = await db.query(
      `SELECT m.*, COALESCE(json_agg(dl.*) FILTER (WHERE dl.id IS NOT NULL), '[]') AS dose_logs
       FROM medicines m
       LEFT JOIN dose_logs dl ON dl.medicine_id = m.id AND dl.log_date = CURRENT_DATE
       WHERE m.user_id = $1 AND m.active = TRUE
       GROUP BY m.id ORDER BY m.created_at DESC`,
      [req.user.userId]
    );
    res.json(meds.rows);
  } catch (err) {
    logger.error('getMedicines:', err);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
};

exports.addMedicine = async (req, res) => {
  try {
    const { name, dosage, frequency, times, notes, prescribed_by, start_date, end_date } = req.body;
    const id = uuidv4();
    await db.query(
      `INSERT INTO medicines (id,user_id,name,dosage,frequency,times,notes,prescribed_by,start_date,end_date,active,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,NOW())`,
      [id, req.user.userId, name, dosage, frequency, JSON.stringify(times), notes, prescribed_by, start_date, end_date]
    );
    logger.info(`Medicine added: ${name} for user ${req.user.userId}`);
    res.status(201).json({ id, message: `${name} added to your medicines` });
  } catch (err) {
    logger.error('addMedicine:', err);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
};

exports.updateMedicine = async (req, res) => {
  const { name, dosage, frequency, times, notes } = req.body;
  await db.query(
    'UPDATE medicines SET name=$1,dosage=$2,frequency=$3,times=$4,notes=$5,updated_at=NOW() WHERE id=$6 AND user_id=$7',
    [name, dosage, frequency, JSON.stringify(times), notes, req.params.id, req.user.userId]
  );
  res.json({ message: 'Medicine updated' });
};

exports.deleteMedicine = async (req, res) => {
  await db.query('UPDATE medicines SET active=FALSE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.userId]);
  res.json({ message: 'Medicine deactivated' });
};

exports.logDose = async (req, res) => {
  const { status, taken_at, notes } = req.body; // status: 'taken' | 'skipped'
  const logId = uuidv4();
  await db.query(
    `INSERT INTO dose_logs (id, medicine_id, user_id, status, taken_at, log_date, notes)
     VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6)
     ON CONFLICT (medicine_id, log_date) DO UPDATE SET status=$4, taken_at=$5`,
    [logId, req.params.id, req.user.userId, status, taken_at || new Date(), notes]
  );
  res.json({ message: `Dose ${status} at ${new Date().toLocaleTimeString()}` });
};

exports.getAdherence = async (req, res) => {
  const { days = 30 } = req.query;
  const stats = await db.query(
    `SELECT log_date, status, COUNT(*) as count
     FROM dose_logs
     WHERE user_id=$1 AND log_date >= NOW()-INTERVAL '${days} days'
     GROUP BY log_date, status ORDER BY log_date DESC`,
    [req.params.userId]
  );
  const taken  = stats.rows.filter(r => r.status === 'taken').length;
  const total  = stats.rows.length;
  const pct    = total ? Math.round((taken / total) * 100) : 0;
  res.json({ adherencePercent: pct, taken, total, logs: stats.rows });
};

exports.getTodayReminders = async (req, res) => {
  const meds = await db.query(
    `SELECT m.name, m.dosage, m.times,
       COALESCE(dl.status, 'pending') AS today_status
     FROM medicines m
     LEFT JOIN dose_logs dl ON dl.medicine_id=m.id AND dl.log_date=CURRENT_DATE
     WHERE m.user_id=$1 AND m.active=TRUE`,
    [req.user.userId]
  );
  res.json(meds.rows);
};
