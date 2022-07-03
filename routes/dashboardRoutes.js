const router = require("express").Router();

const Category = require("../models/Category.model");
const ArtPiece = require("../models/ArtPiece.model");

router.get("/", async (req, res) => {
    try {
        const categories = await Category.find();
        const artPieces = await ArtPiece.find();

        return res
            .status(200)
            .json({
                categories: categories.length,
                artPieces: artPieces.length,
            });
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
