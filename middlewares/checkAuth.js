const User = require("../models/User.model");

module.exports.checkAuth = (req, res, next) => {
    const { userId } = req.session;

    if (!userId) {
        return res.status(401).send({ message: "Authorization failed" });
    } else {
        next();
    }
};

module.exports.checkAdminAuth = async (req, res, next) => {
    const { userId } = req.session;

    if (!userId) {
        return res.status(401).send({ message: "Authorization failed" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (user.role !== "admin") {
            return res.status(401).send({ message: "Unauthorized" });
        }

        next();
    } catch (error) {
        res.sendStatus(500);
        throw new Error(error);
    }
};
