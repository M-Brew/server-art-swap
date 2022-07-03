const { Schema, model } = require('mongoose');

const artPieceSchema = new Schema(
    {
        title: String,
        slug: String,
        categoryId: Schema.Types.ObjectId,
        image: String,
        brief: String,
        width: Number,
        height: Number,
        price: Number,
        year: Number
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true
        }
    }
);

module.exports = model('ArtPiece', artPieceSchema);