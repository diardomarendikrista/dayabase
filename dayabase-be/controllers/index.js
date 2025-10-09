class Controller {
  static getRootHandler(req, res) {
    res.status(200).json({ message: "Dayabase BE is Running. v 0.1.1" });
  }
}

module.exports = Controller;
