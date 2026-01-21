const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

class AuthController {
  /**
   * @description Cek apakah sudah ada user di sistem (untuk setup admin pertama)
   * @route GET /api/auth/setup-status
   */
  static async getSetupStatus(req, res) {
    const { rows } = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(rows[0].count, 10);
    res.json({ needsSetup: userCount === 0 });
  }

  /**
   * @description  Registrasi admin pertama
   * @route POST /api/auth/register-first-admin
   */
  static async registerFirstAdmin(req, res) {
    const { email, password, fullName } = req.body;

    const { rows } = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(rows[0].count, 10) > 0) {
      return res
        .status(403)
        .json({ message: "Admin already exists. Registration is closed." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role",
      [email, password_hash, fullName, "ADMIN"]
    );
    res.status(201).json(newUser.rows[0]);
  }

  /**
   * @description Login untuk semua user
   * @route POST /api/auth/login
   */
  static async login(req, res) {
    const { email, password } = req.body;

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  }

  /**
   * @description check auth for decode token
   * @route GET /api/auth/me
   */
  static async getMe(req, res) {
    const userId = req.user.id;

    const { rows } = await pool.query(
      "SELECT id, email, full_name, role FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      user: {
        id: rows[0].id,
        email: rows[0].email,
        fullName: rows[0].full_name,
        role: rows[0].role,
      },
    });
  }
}

module.exports = AuthController;
