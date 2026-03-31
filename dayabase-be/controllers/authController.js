const AuthService = require("../services/AuthService");

class AuthController {
  /**
   * @description Check if a user exists in the system (for initial admin setup)
   * @route GET /api/auth/setup-status
   */
  static async getSetupStatus(req, res) {
    try {
      const hasUser = await AuthService.hasAnyUser();
      res.json({ needsSetup: !hasUser });
    } catch (error) {
      res.status(500).json({ message: "Error checking setup status", error: error.message });
    }
  }

  /**
   * @description Register the first admin
   * @route POST /api/auth/register-first-admin
   */
  static async registerFirstAdmin(req, res) {
    const { email, password, fullName } = req.body;

    try {
      const newUser = await AuthService.registerFirstAdmin({ email, password, fullName });
      res.status(201).json(newUser);
    } catch (error) {
      if (error.message === "Admin already exists. Registration is closed.") {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  }

  /**
   * @description Login for all users
   * @route POST /api/auth/login
   */
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      const result = await AuthService.login(email, password);

      if (!result) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  }

  /**
   * @description check auth for decode token
   * @route GET /api/auth/me
   */
  static async getMe(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user data", error: error.message });
    }
  }
}

module.exports = AuthController;
