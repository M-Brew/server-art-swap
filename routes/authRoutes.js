const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/User.model");
const {
    signUpValidation,
    signInValidation,
} = require("../validation/authValidation");
const { TOKEN_SECRET = "tokensecret", SESS_NAME = "sid" } = process.env;

const generateToken = (payload) => {
    return jwt.sign(payload, TOKEN_SECRET, { expiresIn: "1h" });
};

router.post("/sign-up", async (req, res) => {
    try {
        const { firstName, lastName, userName, email, password } = req.body;

        const { valid, errors } = signUpValidation({
            firstName,
            lastName,
            userName,
            email,
            password,
        });
        if (!valid) {
            return res.status(400).json({ errors });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "User with email exists" });
        }

        const existingUsername = await User.findOne({ userName });
        if (existingUsername) {
            return res
                .status(400)
                .json({ error: "User with user name exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        const token = generateToken({ id: newUser._id });
        req.session.token = token;

        return res.status(201).json({
            userName: newUser.userName,
            role: newUser.role,
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

router.post("/sign-in", async (req, res) => {
    try {
        const { email, password } = req.body;

        const { valid, errors } = signInValidation({ email, password });
        if (!valid) {
            return res.status(400).json({ errors });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = generateToken({ id: user._id });
        req.session.token = token;

        return res.status(200).json({
            userName: user.userName,
            role: user.role,
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

router.post("/admin-sign-in", async (req, res) => {
    try {
        const { email, password } = req.body;

        const { valid, errors } = signInValidation({ email, password });
        if (!valid) {
            return res.status(400).json({ errors });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        
        if (user.role !== "admin") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const token = generateToken({ id: user._id });
        req.session.token = token;

        return res.status(200).json({
            userName: user.userName,
            role: user.role,
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

router.get("/check-auth", async (req, res) => {
    const { token } = req.session;

    if (!token) {
        return res.sendStatus(401);
    }

    try {
        const payload = jwt.verify(token, TOKEN_SECRET);
        const user = await User.findById(payload.id);

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        return res.status(200).json({
            userName: user.userName,
            role: user.role,
        });
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.delete("/sign-out", (req, res) => {
    const { token } = req.session;

    if (!token) {
        return res.sendStatus(401);
    }

    req.session.destroy((err) => {
        if (err) throw err;

        res.clearCookie(SESS_NAME);
        return res.status(204).json({ message: "Signed out successfully" });
    });
});

module.exports = router;
