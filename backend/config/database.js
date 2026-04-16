/**
 * Database Configuration – PostgreSQL + MongoDB
 */
const { Pool }    = require('pg');
const mongoose    = require('mongoose');
const logger      = require('./logger');

// ── PostgreSQL ────────────────────────────────────────────────
const pgPool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB       || 'medibuddy',
  user:     process.env.PG_USER     || 'medibuddy_user',
  password: process.env.PG_PASS     || 'medibuddy_pass',
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pgPool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err.message);
});

// ── MongoDB ───────────────────────────────────────────────────
const mongoOptions = {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
  maxPoolSize:        10,
};

// ── Exported functions ────────────────────────────────────────
async function connectPostgres() {
  const client = await pgPool.connect();
  await client.query('SELECT 1');  // Test ping
  client.release();
  logger.info('✅ PostgreSQL connected');
  return pgPool;
}

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medibuddy';
  await mongoose.connect(uri, mongoOptions);
  logger.info('✅ MongoDB connected');
}

// Query helper
async function query(text, params) {
  const start = Date.now();
  const res   = await pgPool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) logger.warn(`Slow query (${duration}ms): ${text}`);
  return res;
}

module.exports = { connectPostgres, connectMongo, query, pgPool };
