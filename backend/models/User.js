/**
 * User Model
 */
const db = require('../config/database');

class User {
  static async findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateLanguage(id, lang) {
    await db.query('UPDATE users SET language = $1, updated_at = NOW() WHERE id = $2', [lang, id]);
  }

  static async updateRole(id, role) {
    await db.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
  }
}

module.exports = User;
