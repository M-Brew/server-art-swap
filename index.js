const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const { PORT = 5001, MONGO_URI = "mongodb://localhost/ART_SWAP_DB" } =
    process.env;

const app = express();

app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/art-pieces", require("./routes/artPieceRoutes"));

// db connection
mongoose.connect(MONGO_URI);
mongoose.connection.once("open", () =>
    console.log("Connected to database successfully")
);

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
