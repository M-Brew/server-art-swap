const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const Category = require("../models/Category.model");
const ArtPiece = require("../models/ArtPiece.model");
const { categoryValidation } = require("../validation/categoryValidation");
const { uploadImage } = require("../middlewares/imageUpload");
const { checkAdminAuth } = require("../middlewares/checkAuth");

router.post("/", checkAdminAuth, uploadImage.single("image"), async (req, res) => {
    try {
        const { name, description } = req.body;
        const image = req.file ? req.file.filename : "";

        const { valid, errors } = categoryValidation({ name, description });
        if (!valid) {
            if (image !== "") {
                fs.unlinkSync(path.join(__dirname, "../temp", image));
            }
            return res.status(400).json(errors);
        }

        const slug = name.replace(/\s+/g, "-").toLowerCase();

        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            if (image !== "") {
                fs.unlinkSync(path.join(__dirname, "../temp", image));
            }
            return res
                .status(400)
                .json({ error: "category with name already exists" });
        }

        const newCategory = new Category();
        newCategory.name = name;
        newCategory.slug = slug;
        newCategory.description = description;
        newCategory.image = `/uploads/${newCategory._id}/${image}`;
        newCategory.artPieces = 0;

        fs.mkdirSync(path.join(__dirname, "../uploads", newCategory._id.toString()));
        if (image !== "") {
            fs.rename(
                path.join(__dirname, "../temp", image),
                path.join(__dirname, "../uploads", newCategory._id.toString(), image),
                (error) => {
                    if (error) {
                        throw new Error(error);
                    }
                }
            );
        }
        
        const category = await newCategory.save();

        return res.status(201).json(category);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/", async (req, res) => {
    try {
        const categories = await Category.find();

        return res.status(200).json(categories);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: "category not found" });
        }

        return res.status(200).json(category);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.put("/:categoryId", checkAdminAuth, uploadImage.single("image"), async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description } = req.body;
        const newImage = req.file ? req.file.filename : "";

        const { valid, errors } = categoryValidation({ name, description });
        if (!valid) {
            return res.status(400).json(errors);
        }

        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ error: "category not found" });
        }

        const slug = name.replace(/\s+/g, "-").toLowerCase();

        if (newImage !== "") {
            if (existingCategory.image && existingCategory.image !== "") {
                fs.rename(
                    path.join(__dirname, "../temp", newImage),
                    path.join(__dirname, "../uploads", existingCategory._id.toString(), newImage),
                    (error) => {
                        if (error) {
                            throw new Error(error);
                        }
                    }
                );
                fs.unlinkSync(
                    path.join(__dirname, "../", existingCategory.image)
                );
            }
        }

        const updateData = { name, slug, description };
        if (newImage !== "") {
            updateData.image = `/uploads/${existingCategory._id.toString()}/${newImage}`;
        }

        const updatedCategory = await Category.findOneAndUpdate(
            { _id: categoryId },
            updateData,
            { new: true, useFindAndModify: false }
        );

        return res.status(200).json(updatedCategory);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.delete("/:categoryId/art-pieces", checkAdminAuth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ error: "category does not exist" });
        }

        const artPieces = await ArtPiece.find({ categoryId });
        if (artPieces.length < 1) {
            return res
                .status(400)
                .json({ error: "no art-pieces under this category" });
        }

        for (const artPiece of artPieces) {
            await ArtPiece.findByIdAndDelete(artPiece._id);
        }

        fs.rmSync(
            path.join(
                __dirname,
                "../uploads",
                existingCategory._id.toString(),
                "art-pieces"
            ),
            {
                recursive: true,
                force: true,
            }
        );

        await Category.findOneAndUpdate(
            { _id: categoryId },
            { artPieces: 0 },
            { new: true, useFindAndModify: false }
        );

        return res.sendStatus(204);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.delete("/:categoryId", checkAdminAuth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ error: "category not found" });
        }

        if (existingCategory.artPieces > 0) {
            return res.status(403).json({
                error: "delete all art pieces under this category first",
            });
        }

        if (existingCategory.image !== "") {
            fs.rmSync(
                path.join(__dirname, "../uploads", existingCategory.id),
                {
                    recursive: true,
                    force: true,
                }
            );
        }

        await Category.findByIdAndDelete(categoryId);

        return res.sendStatus(204);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
