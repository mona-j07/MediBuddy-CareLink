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

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const userData = user.rows[0];
    if (userData.is_verified) return res.status(400).json({ error: 'Account already verified' });
    if (new Date() > new Date(userData.otp_expiry)) return res.status(400).json({ error: 'OTP expired' });
    if (userData.otp_code !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    await db.query('UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE id = $1', [userData.id]);
    res.json({ message: 'Account verified successfully' });
  } catch (err) {
    logger.error('verifyOTP:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ error: 'Email not verified. Please verify your account.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    logger.error('login:', err);
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
