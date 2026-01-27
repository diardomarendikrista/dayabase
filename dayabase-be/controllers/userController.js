const UserService = require("../services/UserService");

class UserController {
  /**
   * @description Create a new user (by Admin)
   * @route POST /api/users
   */
  static async createUser(req, res) {
    const { email, password, fullName, role } = req.body;

    try {
      const newUser = await UserService.createUser({ email, password, fullName, role });
      res.status(201).json(newUser);
    } catch (error) {
      if (error.message === "Email is already registered.") {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.includes("required") || error.message.includes("Invalid")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error creating user", error: error.message });
    }
  }

  /**
   * @description Get all users
   * @route GET /api/users
   */
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error: error.message });
    }
  }

  /**
   * @description Update a user (by Admin)
   * @route PUT /api/users/:id
   */
  static async updateUser(req, res) {
    const { id } = req.params;
    const { fullName, role, is_active } = req.body;

    try {
      const updatedUser = await UserService.updateUser(id, { fullName, role, is_active });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating user", error: error.message });
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
      const success = await UserService.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error: error.message });
    }
  }

  /**
   * @description Changes the logged-in user's password
   * @route PUT /api/account/change-password
   */
  static async changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
      await UserService.changePassword(userId, { oldPassword, newPassword });
      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      if (error.message.includes("required") || error.message.includes("at least 6 characters")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("User not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Incorrect")) {
        return res.status(401).json({ message: error.message });
      }
      res.status(500).json({ message: "Error changing password", error: error.message });
    }
  }
}

module.exports = UserController;
