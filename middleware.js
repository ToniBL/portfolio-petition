module.exports.requireLoggedOutUser = (req, res, next) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

module.exports.requireLoggedInUser = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect("/register");
    } else {
        next();
    }
};

module.exports.requireSignature = (req, res, next) => {
    if (!req.session.signatureId) {
        res.redirect("/register");
    } else {
        next();
    }
};

module.exports.requireNoSignature = (req, res, next) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};
