const artPieceValidation = ({
    title,
    categoryId,
    brief,
    width,
    height,
    price,
    year,
}) => {
    const errors = {};

    if (!title || title.trim() === "") {
        errors.title = "title is required";
    }

    if (!categoryId || categoryId.toString().trim() === "") {
        errors.categoryId = "category id is required";
    } else {
        const regex = /^[a-fA-F0-9]{24}$/;
        if (!categoryId.match(regex)) {
            errors.categoryId = "category id must be a valid id";
        }
    }

    if (!brief || brief.trim() === "") {
        errors.brief = "brief is required";
    }

    if (!width || width.trim() === "") {
        errors.width = "width is required";
    }

    if (!height || height.trim() === "") {
        errors.height = "height is required";
    }

    if (!price || price.trim() === "") {
        errors.price = "price is required";
    }

    if (!year || year.trim() === "") {
        errors.year = "year is required";
    }

    return {
        valid: Object.keys(errors).length < 1,
        errors,
    };
};

module.exports = { artPieceValidation };
