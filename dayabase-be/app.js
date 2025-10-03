const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

const router = require("./routes");

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
