const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const Category = require("../models/Category.model");
const ArtPiece = require("../models/ArtPiece.model");
const { uploadImage } = require("../middlewares/imageUpload");
const { artPieceValidation } = require("../validation/artPieceValidation");
const { checkAdminAuth } = require("../middlewares/checkAuth");

router.post(
    "/",
    checkAdminAuth,
    uploadImage.single("image"),
    async (req, res) => {
        try {
            const { title, categoryId, brief, width, height, price, year } =
                req.body;
            const image = req.file ? req.file.filename : "";

            const { valid, errors } = artPieceValidation({
                title,
                categoryId,
                brief,
                width,
                height,
                price,
                year,
            });
            if (!valid) {
                return res.status(400).json(errors);
            }

            if (image === "") {
                return res.status(400).json({ image: "image is required" });
            }

            const existingCategory = await Category.findById(categoryId);
            if (!existingCategory) {
                return res
                    .status(400)
                    .json({ error: "category does not exist" });
            }

            if (
                !fs.existsSync(
                    path.join(
                        __dirname,
                        "../uploads",
                        existingCategory._id.toString(),
                        "art-pieces"
                    )
                )
            ) {
                fs.mkdirSync(
                    path.join(
                        __dirname,
                        "../uploads",
                        existingCategory._id.toString(),
                        "art-pieces"
                    )
                );
            }

            fs.rename(
                path.join(__dirname, "../temp", image),
                path.join(
                    __dirname,
                    "../uploads",
                    existingCategory._id.toString(),
                    "art-pieces",
                    image
                ),
                (error) => {
                    if (error) {
                        throw new Error(error);
                    }
                }
            );

            const newArtPiece = new ArtPiece({
                title,
                categoryId,
                brief,
                width,
                height,
                price,
                year,
                image: `/uploads/${existingCategory._id.toString()}/art-pieces/${image}`,
            });
            const artPiece = await newArtPiece.save();

            await Category.findOneAndUpdate(
                { _id: categoryId },
                { artPieces: existingCategory.artPieces + 1 },
                { new: true, useFindAndModify: false }
            );

            return res.status(201).json({ artPiece });
        } catch (error) {
            res.sendStatus(500);
            throw new Error(error);
        }
    }
);

router.get("/", async (req, res) => {
    try {
        const artPieces = await ArtPiece.find();
        return res.status(200).json(artPieces);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/category/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ error: "category does not exist" });
        }

        const artPieces = await ArtPiece.find({ categoryId });
        return res.status(200).json(artPieces);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/:artPieceId", async (req, res) => {
    try {
        const { artPieceId } = req.params;
        const artPiece = await ArtPiece.findById(artPieceId);
        if (!artPiece) {
            return res.status(404).json({ error: "art piece not found" });
        }

        return res.status(200).json(artPiece);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.put(
    "/:artPieceId",
    checkAdminAuth,
    uploadImage.single("image"),
    async (req, res) => {
        try {
            const { artPieceId } = req.params;
            const {
                title,
                categoryId,
                brief,
                width,
                height,
                price,
                year,
                otherSizes,
            } = req.body;

            const { valid, errors } = artPieceValidation({
                title,
                categoryId,
                brief,
                width,
                height,
                price,
                year,
            });
            if (!valid) {
                return res.status(400).json({ errors });
            }

            const existingCategory = await Category.findById(categoryId);
            if (!existingCategory) {
                return res
                    .status(404)
                    .json({ error: "category does not exist" });
            }

            const existingArtPiece = await ArtPiece.findById(artPieceId);
            if (!existingArtPiece) {
                return res.status(404).json({ error: "art piece not found" });
            }

            const updateData = {
                title,
                categoryId,
                brief,
                width,
                height,
                price,
                year,
            };
            if (req.file) {
                if (existingArtPiece.image && existingArtPiece.image !== "") {
                    fs.rename(
                        path.join(__dirname, "../temp", req.file.filename),
                        path.join(
                            __dirname,
                            "../uploads",
                            existingCategory._id.toString(),
                            "art-pieces",
                            req.file.filename
                        ),
                        (error) => {
                            if (error) {
                                throw new Error(error);
                            }
                        }
                    );
                    fs.unlinkSync(
                        path.join(__dirname, "../", existingArtPiece.image)
                    );
                }
                updateData.image = `/uploads/${existingCategory._id.toString()}/art-pieces/${
                    req.file.filename
                }`;
            }
            if (otherSizes) {
                const sizes = JSON.parse(otherSizes).map((size) => ({
                    width: size.width ?? 0,
                    height: size.height ?? 0,
                    price: size.price ?? 0,
                }));
                updateData.otherSizes = sizes;
            }

            const updatedArtPiece = await ArtPiece.findOneAndUpdate(
                { _id: artPieceId },
                updateData,
                { new: true, useFindAndModify: false }
            );

            return res.status(200).json({ artPiece: updatedArtPiece });
        } catch (error) {
            res.sendStatus(500);
            throw new Error(error);
        }
    }
);

router.delete("/:artPieceId", checkAdminAuth, async (req, res) => {
    try {
        const { artPieceId } = req.params;
        const existingArtPiece = await ArtPiece.findById(artPieceId);
        if (!existingArtPiece) {
            return res.status(404).send({ message: "art piece not found" });
        }

        if (existingArtPiece.image && existingArtPiece.image !== "") {
            fs.unlinkSync(path.join(__dirname, "../", existingArtPiece.image));
        }

        const existingCategory = await Category.findById(
            existingArtPiece.categoryId
        );
        if (!existingCategory) {
            return res.status(404).json({ error: "category does not exist" });
        }

        await ArtPiece.findByIdAndDelete(artPieceId);

        await Category.findOneAndUpdate(
            { _id: existingArtPiece.categoryId },
            { artPieces: parseInt(existingCategory.artPieces) - 1 },
            { new: true, useFindAndModify: false }
        );

        return res.sendStatus(204);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
