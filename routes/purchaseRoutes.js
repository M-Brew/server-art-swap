const router = require("express").Router();
const Purchase = require("../models/Purchase.model");
const { checkAdminAuth } = require("../middlewares/checkAuth");

router.get("/", checkAdminAuth, async (req, res) => {
    try {
        const purchases = await Purchase.find()
            .populate("user")
            .populate({ path: "cartItems", populate: "artPiece" })
            .sort('-1');

        return res.status(200).json(purchases);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/:purchaseId", checkAdminAuth, async (req, res) => {
    try {
        const { purchaseId } = req.params;

        const purchase = await Purchase.findById(purchaseId)
            .populate("user")
            .populate({ path: "cartItems", populate: "artPiece" });
        if (!purchase) {
            return res.status(404).json({ error: "purchase not found" });
        }

        return res.status(200).json(purchase);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.put("/:purchaseId", checkAdminAuth, async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const { status } = req.body;

        const existingPurchase = await Purchase.findById(purchaseId);
        if (!existingPurchase) {
            return res.status(404).json({ error: "purchase not found" });
        }

        const updatedPurchase = await Purchase.findOneAndUpdate(
            { _id: purchaseId },
            { status, deliveryDate: Date() },
            { new: true, useFindAndModify: false }
        );

        return res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
