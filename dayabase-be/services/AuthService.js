const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

class AuthService {
  /**
   * Check if any user exists
   */
  async hasAnyUser() {
    const { rows } = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(rows[0].count, 10);
    return userCount > 0;
  }

  /**
   * Register first admin
   */
  async registerFirstAdmin({ email, password, fullName }) {
    // Double check to prevent race conditions (though simple check here is fine for now)
    const exists = await this.hasAnyUser();
    if (exists) {
      throw new Error("Admin already exists. Registration is closed.");
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role",
      [email, password_hash, fullName, "ADMIN"]
    );
    return result.rows[0];
  }

  /**
   * Login user
   */
  async login(email, password) {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return null;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    };
  }

  /**
   * Get user by ID (for Me endpoint)
   */
  async getUserById(userId) {
    const { rows } = await pool.query(
      "SELECT id, email, full_name, role FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) return null;

    return {
      id: rows[0].id,
      email: rows[0].email,
      fullName: rows[0].full_name,
      role: rows[0].role,
    };
  }
}

module.exports = new AuthService();
