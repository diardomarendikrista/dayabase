const bcrypt = require("bcrypt");
const pool = require("../config/db");

class UserController {
  /**
   * @description Create a new user (by Admin)
   * @route POST /api/users
   */
  static async createUser(req, res) {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    try {
      const password_hash = await bcrypt.hash(password, 10);
      const newUser = await pool.query(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, is_active, created_at",
        [email, password_hash, fullName, role]
      );
      res.status(201).json(newUser.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Error unique violation
        return res
          .status(409)
          .json({ message: "Email is already registered." });
      }
      console.error("Failed to create user:", error);
      res
        .status(500)
        .json({ message: "Failed to create user.", error: error.message });
    }
  }

  /**
   * @description Get all users
   * @route GET /api/users
   */
  static async getAllUsers(req, res) {
    try {
      // Fetch all columns except password_hash
      const allUsers = await pool.query(
        "SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC"
      );
      res.status(200).json(allUsers.rows);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users." });
    }
  }

  /**
   * @description Update a user (by Admin)
   * @route PUT /api/users/:id
   */
  static async updateUser(req, res) {
    const { id } = req.params;
    const { fullName, role, is_active } = req.body; // Admin can change these
    if (!fullName || !role || typeof is_active !== "boolean") {
      return res
        .status(400)
        .json({ message: "Full name, role, and active status are required." });
    }
    try {
      const updatedUser = await pool.query(
        "UPDATE users SET full_name = $1, role = $2, is_active = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, full_name, role, is_active",
        [fullName, role, is_active, id]
      );
      if (updatedUser.rowCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json(updatedUser.rows[0]);
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      res.status(500).json({ message: "Failed to update user." });
    }
  }

  /**
   * @description Delete a user (by Admin)
   * @route DELETE /api/users/:id
   */
  static async deleteUser(req, res) {
    const { id } = req.params;
    // Prevent admin from deleting their own account
    if (parseInt(id, 10) === req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot delete your own account." });
    }
    try {
      const deleteOp = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING *",
        [id]
      );
      if (deleteOp.rowCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      res.status(500).json({ message: "Failed to delete user." });
    }
  }

  /**
   * @description Changes the logged-in user's password
   * @route PUT /api/account/change-password
   */
  static async changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // From JWT token

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long." });
    }

    try {
      // 1. Get the current password hash from the DB
      const { rows } = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      const user = rows[0];

      // 2. Compare the old password with the hash
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect old password." });
      }

      // 3. Hash the new password and update the DB
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [newPasswordHash, userId]
      );

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error(`Failed to change password for user ${userId}:`, error);
      res.status(500).json({ message: "Failed to change password." });
    }
  }
}

module.exports = UserController;
