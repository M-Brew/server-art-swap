const router = require("express").Router();
const { checkAdminAuth } = require("../middlewares/checkAuth");
const User = require("../models/User.model");

router.get("/", checkAdminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'guest' });

        return res.status(200).json(users);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/:userId", checkAdminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;