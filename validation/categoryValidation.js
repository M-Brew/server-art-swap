const categoryValidation = ({ name, description }) => {
    const errors = {};

    if (!name || name.trim() === "") {
        errors.name = "name is required";
    }

    if (!description || description.trim() === "") {
        errors.description = "description is required";
    }

    return {
        valid: Object.keys(errors).length < 1,
        errors
    }
};

module.exports = { categoryValidation };
