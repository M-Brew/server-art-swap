const checkoutValidation = ({ items }) => {
    const errors = {};

    if (!items || items.length < 1) {
        errors.items = "items required";
    }

    return {
        valid: Object.keys(errors).length < 1,
        errors
    }
};

module.exports = { checkoutValidation };