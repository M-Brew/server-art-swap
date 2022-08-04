const router = require("express").Router();

const { checkAdminAuth } = require("../middlewares/checkAuth");
const Category = require("../models/Category.model");
const ArtPiece = require("../models/ArtPiece.model");
const User = require("../models/User.model");
const Purchase = require("../models/Purchase.model");

router.get("/", checkAdminAuth, async (req, res) => {
    try {
        const categories = await Category.find();
        const artPieces = await ArtPiece.find();
        const users = await User.find({ role: "guest" }).sort('-1').limit(5);
        const purchases = await Purchase.find().populate('user').sort('-1').limit(5);

        return res.status(200).json({
            categories: categories.length,
            artPieces: artPieces.length,
            users: users.length,
            latestUsers: users,
            latestPurchases: purchases
        });
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
