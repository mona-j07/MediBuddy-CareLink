/**
 * Auth Controller
 */
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db       = require('../../config/database');
const { generateToken } = require('../../middleware/auth.middleware');
const logger   = require('../../config/logger');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

exports.register = async (req, res) => {
  try {
    const { name, phone, password, role, language = 'en', age, gender } = req.body;

    // Check existing user
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User with this phone already exists' });
    }

    const hash   = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, name, phone, password_hash, role, language, age, gender, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [userId, name, phone, hash, role, language, age, gender]
    );

    const token = generateToken({ id: userId, role, phone });
    logger.info(`New user registered: ${phone} (${role})`);
    res.status(201).json({ message: 'Registration successful', token, userId, role });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const result = await db.query(
      'SELECT id, name, role, password_hash, language FROM users WHERE phone = $1',
      [phone]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: user.id, role: user.role, phone });
    await db.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    logger.info(`User logged in: ${phone}`);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, language: user.language } });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.refresh = async (req, res) => {
  // Implement token refresh logic here
  res.json({ message: 'Token refresh endpoint' });
};

exports.logout = async (req, res) => {
  // In production: blacklist token in Redis
  res.json({ message: 'Logged out successfully' });
};

exports.requestOTP = async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });
  // In production: send SMS via Twilio/MSG91
  logger.info(`OTP for ${phone}: ${otp}`);
  res.json({ message: 'OTP sent to your phone', dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined });
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore.get(phone);
  if (!record || record.expires < Date.now() || record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(phone);
  res.json({ message: 'OTP verified successfully', verified: true });
};
