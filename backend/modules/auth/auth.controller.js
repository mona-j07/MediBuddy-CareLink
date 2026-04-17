/**
 * Auth Controller
 */
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db       = require('../../config/database');
const logger   = require('../../config/logger');

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const id = uuidv4();

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, otp_code, otp_expiry, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
      [id, name, email, passwordHash, role, otp, expiry]
    );

    // Send Email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"MediBuddy CareLink" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Verify Your MediBuddy Account',
          html: `<h3>Welcome to MediBuddy!</h3><p>Your verification code is: <b>${otp}</b></p><p>This code expires in 5 minutes.</p>`
        });
      } else {
        logger.warn('EMAIL_USER/PASS not set. Logging OTP instead:', otp);
      }
    } catch (mailErr) {
      logger.error('Mail send failed:', mailErr.message);
    }

    res.status(201).json({ message: 'OTP sent to email', email, dev_otp: otp });
  } catch (err) {
    logger.error('register:', err);
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
      { id: user.id, role: user.role, name: user.name },
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
  res.json({ message: 'Token refresh endpoint' });
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
