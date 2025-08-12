class UserController {
  static async createUserByAdmin(req, res) {
    const { email, password, fullName, role } = req.body;
    // Validasi role
    if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      return res.status(400).json({ message: "Role tidak valid." });
    }
    try {
      const password_hash = await bcrypt.hash(password, 10);
      const newUser = await pool.query(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role",
        [email, password_hash, fullName, role]
      );
      res.status(201).json(newUser.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal membuat pengguna.", error: error.message });
    }
  }
  // method lain seperti getAllUsers, deleteUser, dll. nanti di sini
}

module.exports = UserController;
