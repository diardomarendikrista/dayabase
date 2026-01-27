const bcrypt = require("bcrypt");
const pool = require("../config/db");

class UserService {
  /**
   * Create new user
   */
  async createUser({ email, password, fullName, role }) {
    if (!email || !password || !fullName || !role) {
      throw new Error("All fields are required.");
    }
    if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      throw new Error("Invalid role.");
    }

    try {
      const password_hash = await bcrypt.hash(password, 10);
      const newUser = await pool.query(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, is_active, created_at",
        [email, password_hash, fullName, role]
      );
      return newUser.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Email is already registered.");
      }
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    const allUsers = await pool.query(
      "SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    return allUsers.rows;
  }

  /**
   * Update user
   */
  async updateUser(id, { fullName, role, is_active }) {
    if (!fullName || !role || typeof is_active !== "boolean") {
      throw new Error("Full name, role, and active status are required.");
    }

    const updatedUser = await pool.query(
      "UPDATE users SET full_name = $1, role = $2, is_active = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, full_name, role, is_active",
      [fullName, role, is_active, id]
    );

    if (updatedUser.rowCount === 0) return null;
    return updatedUser.rows[0];
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const deleteOp = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    return deleteOp.rowCount > 0;
  }

  /**
   * Change password
   */
  async changePassword(userId, { oldPassword, newPassword }) {
    if (!oldPassword || !newPassword) {
      throw new Error("Old password and new password are required.");
    }
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    // Get the current password hash
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) throw new Error("User not found.");

    const user = rows[0];

    // Compare the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) throw new Error("Incorrect old password.");

    // Update with new hash
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newPasswordHash, userId]
    );

    return true;
  }
}

module.exports = new UserService();
