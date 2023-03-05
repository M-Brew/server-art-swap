require("dotenv").config();
const router = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const { checkAuth } = require("../middlewares/checkAuth");
const ArtPiece = require("../models/ArtPiece.model");
const Purchase = require("../models/Purchase.model");
const { checkoutValidation } = require("../validation/checkoutValidation");

router.get("/something", (req, res) => {
    return res.json({ hello: "world" });
});

router.get("/retrieve", async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(
        "cs_test_a11CZWhoSaaqRrQDOcH6d75kBe5CjdIsORvFBdA4OmUWWzQVIqUYnZIGEE"
        // "cs_test_a1N5XmlIKaIV00YvLMNdX6ktqQnAaUxUQDDHFdC5mkwDFBtPXvE7EMTM33"
    );

    // const paymentIntent = await stripe.paymentIntents.capture(
    //     'pi_3LUVXEFsTy0JDyx30RydthcL'
    //   );

    return res.status(200).json(session);
});

router.post("/", checkAuth, async (req, res) => {
    try {
        const { id } = req.user;
        const { items } = req.body;
        console.log(items);

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
            pieces.push({
                piece,
                quantity: item.quantity,
                selectedId: item.selectedSizeId,
            });
        }

        console.log(
            pieces.map((item) => {
                const selectedSize = item.piece.otherSizes.find(
                    (size) => size.id === selectedSizeId
                );
                return {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: item.piece.title,
                        },
                        unit_amount:
                            (selectedSize
                                ? selectedSize.price
                                : item.piece.price) * 100,
                    },
                    quantity: item.quantity,
                };
            })
        );

        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ["card"],
        //     mode: "payment",
        //     line_items: pieces.map((item) => {
        //         const selectedSize = item.piece.otherSizes.find(
        //             (size) => size.id === selectedSizeId
        //         );
        //         return {
        //             price_data: {
        //                 currency: "usd",
        //                 product_data: {
        //                     name: item.piece.title,
        //                 },
        //                 unit_amount:
        //                     (selectedSize
        //                         ? selectedSize.price
        //                         : item.piece.price) * 100,
        //             },
        //             quantity: item.quantity,
        //         };
        //     }),
        //     success_url: `${process.env.CLIENT_BASE_URL}/checkout-successful`,
        //     cancel_url: `${process.env.CLIENT_BASE_URL}/cart`,
        // });

        // console.log({ session });

        // const sessionDetails = await stripe.checkout.sessions.retrieve(
        //     session.id
        // );

        // console.log({ sessionDetails });

        // stripe.checkout.sessions
        //     .create({
        //         payment_method_types: ["card"],
        //         mode: "payment",
        //         line_items: pieces.map((item) => ({
        //             price_data: {
        //                 currency: "usd",
        //                 product_data: {
        //                     name: item.piece.title,
        //                 },
        //                 unit_amount: item.piece.price * 100,
        //             },
        //             quantity: item.quantity,
        //         })),
        //         success_url: `${process.env.CLIENT_BASE_URL}/checkout-successful`,
        //         cancel_url: `${process.env.CLIENT_BASE_URL}/cart`,
        //     })
        //     .then((data) => {
        //         console.log({ data });
        //     });

        // if (sessionDetails.payment_status === "paid") {
        //     const newPurchase = new Purchase({
        //         purchaseId: session.id,
        //         user: id,
        //         amount: session.amount_total,
        //         cartItems: pieces.map((item) => ({
        //             artPiece: item.piece.id,
        //             quantity: item.quantity,
        //         })),
        //     });

        //     console.log({ newPurchase });

        //     await newPurchase.save();
        //     // TODO: send email to admin
        // }

        // return res.status(200).json({ url: session.url });
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
});

module.exports = router;
