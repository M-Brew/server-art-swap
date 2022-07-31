const router = require("express").Router();

const Category = require("../models/Category.model");
const ArtPiece = require("../models/ArtPiece.model");
const User = require("../models/User.model");
const { checkAdminAuth } = require("../middlewares/checkAuth");

router.get("/", checkAdminAuth, async (req, res) => {
    try {
        const categories = await Category.find();
        const artPieces = await ArtPiece.find();
        const users = await User.find({ role: "guest" });

        return res.status(200).json({
            categories: categories.length,
            artPieces: artPieces.length,
            users: users.length,
            latestUsers:
                users.length > 0
                    ? users.reverse().slice(0, 5)
                    : users.reverse(),
        });
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
