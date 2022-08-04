require("dotenv").config();
const router = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const { checkAuth } = require("../middlewares/checkAuth");
const ArtPiece = require("../models/ArtPiece.model");
const Purchase = require("../models/Purchase.model");
const { checkoutValidation } = require("../validation/checkoutValidation");

router.post("/", checkAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { items } = req.body;

        const { valid, errors } = checkoutValidation({ items });
        if (!valid) {
            return res.status(400).json(errors);
        }

        const pieces = [];
        for (const item of items) {
            const piece = await ArtPiece.findById(item.id);
            if (!piece) {
                return res.status(404).json({ errors: "art piece not found" });
            }
            pieces.push({ piece, quantity: item.quantity });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: pieces.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.piece.title,
                    },
                    unit_amount: item.piece.price * 100,
                },
                quantity: item.quantity,
            })),
            success_url: "http://localhost:3000/checkout-successful",
            cancel_url: "http://localhost:3000/cart",
        });

        const sessionDetails = await stripe.checkout.sessions.retrieve(
            "cs_test_a1lwFedeSwZcivm5hRrMrG2lxGQsvqijcbOkh4LMH700dX3gd1B7c5nP5h"
        );

        if (sessionDetails.payment_status === "paid") {
            const newPurchase = new Purchase({
                purchaseId: session.id,
                user: id,
                amount: session.amount_total,
                cartItems: pieces.map((item) => ({
                    artPiece: item.piece.id,
                    quantity: item.quantity
                })),
            });

            await newPurchase.save();
            // TODO: send email to admin
        }

        return res.status(200).json({ url: session.url });
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

router.get("/retrieve", async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(
        "cs_test_a1lwFedeSwZcivm5hRrMrG2lxGQsvqijcbOkh4LMH700dX3gd1B7c5nP5h"
    );

    return res.status(200).json(session);
});

module.exports = router;
