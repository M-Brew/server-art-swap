const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
    {
        name: String,
        slug: String,
        description: String,
        image: String,
        artPieces: Number
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true
        }
    }
);

module.exports = model('Category', categorySchema);
