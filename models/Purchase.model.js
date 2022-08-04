const { Schema, model } = require("mongoose");

const purchaseSchema = new Schema(
    {
        purchaseId: String,
        user: { type: Schema.Types.ObjectId, ref: "User" },
        amount: Number,
        status: { type: String, default: 'pending' },
        cartItems: [
            {
                artPiece: { type: Schema.Types.ObjectId, ref: "ArtPiece" },
                quantity: { type: Number },
            },
        ],
        deliveryDate: String,
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    }
);

module.exports = model("Purchase", purchaseSchema);
