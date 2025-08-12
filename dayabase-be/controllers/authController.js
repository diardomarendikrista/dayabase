const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

class AuthController {
  // Cek apakah sudah ada user di sistem (untuk setup admin pertama)
  static async getSetupStatus(req, res) {
    try {
      const { rows } = await pool.query("SELECT COUNT(*) FROM users");
      const userCount = parseInt(rows[0].count, 10);
      res.json({ needsSetup: userCount === 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to check setup status." });
    }
  }

  // Registrasi admin pertama
  static async registerFirstAdmin(req, res) {
    const { email, password, fullName } = req.body;
    try {
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
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to register admin.", error: error.message });
    }
  }

  // Login untuk semua user
  static async login(req, res) {
    const { email, password } = req.body;
    try {
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (rows.length === 0) {
        return res
          .status(401)
          .json({ message: "Incorrect email or password." });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Incorrect email or password." });
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
    } catch (error) {
      res.status(500).json({ message: "Login failed.", error: error.message });
    }
  }
}

module.exports = AuthController;
