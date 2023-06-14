require("dotenv").config();
const router = require("express").Router();
const https = require("https");

const { checkAuth } = require("../middlewares/checkAuth");
const ArtPiece = require("../models/ArtPiece.model");
const Purchase = require("../models/Purchase.model");
const { checkoutValidation } = require("../validation/checkoutValidation");

const { verifyPayment } = require("../utils/paystack");
const User = require("../models/User.model");

const getTotalAmount = async (items) => {
  let totalAmount = 0;

  for (let item of items) {
    const artPiece = await ArtPiece.findById(item.id);
    if (artPiece) {
      totalAmount += artPiece.price * item.quantity;
    }
  }

  return totalAmount * 100;
};

router.post("/initialize", checkAuth, async (req, res) => {
  try {
    const { items } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).send();
    }

    const totalAmount = await getTotalAmount(items);

    const data = {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: totalAmount,
    };

    return res.status(200).send(data);
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.post("/verify", checkAuth, async (req, res) => {
  try {
    const { reference, items } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).send();
    }

    verifyPayment(https, reference, async (verificationObject) => {
      // console.log({ verificationObject });
      const newPurchase = new Purchase({
        purchaseId: verificationObject?.data?.reference,
        user: user.id,
        amount: verificationObject?.data?.amount,
        cartItems: items,
        deliveryDate: new Date().setDate(new Date().getDate() + 7),
      });

      await newPurchase.save();
    });

    return res.status(200).end();
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

module.exports = router;
