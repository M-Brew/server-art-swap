const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");

require("dotenv").config();

const {
    PORT = 5001,
    MONGO_URI = "mongodb://localhost/ART_SWAP_DB",
    SESS_NAME = "sid",
    SESS_SECRET = "sessionsecret!!",
    SESS_LIFETIME = 1000 * 60 * 60 * 2,
    NODE_ENV = "development",
} = process.env;

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middlewares
app.use(cors());
app.use(express.json());
app.use(
    session({
        name: SESS_NAME,
        resave: false,
        saveUninitialized: true,
        secret: SESS_SECRET,
        store: MongoStore.create({
			mongoUrl: MONGO_URI,
			ttl: 14 * 24 * 60 * 60,
			autoRemove: 'native'
		}),
        cookie: {
			httpOnly: true,
            maxAge: parseInt(SESS_LIFETIME),
            sameSite: true,
            secure: NODE_ENV === "production",
        },
    })
);

// routes
app.use('/api/auth', require("./routes/authRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/art-pieces", require("./routes/artPieceRoutes"));

// db connection
mongoose.connect(MONGO_URI);
mongoose.connection.once("open", () =>
    console.log("Connected to database successfully")
);

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
