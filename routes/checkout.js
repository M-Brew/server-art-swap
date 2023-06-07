require("dotenv").config();
const router = require("express").Router();
const https = require("https");

const { checkAuth } = require("../middlewares/checkAuth");
const ArtPiece = require("../models/ArtPiece.model");
const Purchase = require("../models/Purchase.model");
const { checkoutValidation } = require("../validation/checkoutValidation");

const { initializePayment, verifyPayment } = require("../utils/paystack");
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
      email: user.email,
      amount: totalAmount,
    };

    initializePayment(https, res, data);
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.get("/verify", (req, res) => {
  try {
    const ref = req.query.reference;

    verifyPayment(https, ref, () => {});

    res.status(200).end();
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

module.exports = router;
