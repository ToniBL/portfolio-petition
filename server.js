const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const {
    requireLoggedOutUser,
    requireLoggedInUser,
    requireSignature,
    requireNoSignature,
} = require("./middleware");

const csurf = require("csurf");

let cookie_sec;
if (process.env.cookie_secret) {
    // we are in production
    cookie_sec = process.env.cookie_secret;
} else {
    cookie_sec = require("./secrets.json").sessionSecret;
}
const { hash, compare } = require("./bc");

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// -- MIDDLEWARE
app.use(
    cookieSession({
        secret: cookie_sec,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(csurf());
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
}); // prevents from loading into iframes

app.use(express.static("./public"));

// -- ROUTES

app.get("/", (req, res) => {
    res.redirect("/register");
});

// -- CREATE USER
app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        layout: "main",
        title: "register",
    });
});

app.post("/register", (req, res) => {
    hash(req.body.password)
        .then((hashedPw) => {
            // console.log("hashedPw in register:", hashedPw);

            return db.registerUser(
                req.body.firstname,
                req.body.lastname,
                req.body.email,
                hashedPw
            );
        })
        .then((result) => {
            console.log("result.rows[0].id:", result.rows[0].id);
            //setting the sessionid cookie
            req.session.userId = result.rows[0].id;
            return res.redirect("/profile");
        })
        .catch((err) => {
            console.log("err in registerUser:", err);
            const errInRegister = true;
            return res.render("register", {
                layout: "main",
                title: "register",
                errInRegister,
            });
        });
    //console.log("nach promise");
});

// --PROFILE

app.get("/profile", requireLoggedInUser, (req, res) => {
    res.render("profile", {
        layout: "main",
        title: "profile",
    });
});

app.post("/profile", (req, res) => {
    db.addProfile(
        +req.body.age,
        req.body.city,
        req.body.url,
        req.session.userId
    )
        .then((result) => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in addProfile:", err);
        });
});

app.get("/edit", requireLoggedInUser, (req, res) => {
    db.prefillProfile(req.session.userId)
        .then((result) => {
            console.log("result.rows:", result.rows);
            res.render("edit", {
                title: "edit",
                layout: "main",
                profile: result.rows,
            });
        })
        .catch((err) => {
            console.log("Error in get edit", err);
        });
});

app.post("/edit", (req, res) => {
    if (req.body.password) {
        hash(req.body.password)
            .then((hashedPw) => {
                // console.log("hashedPw in register:", hashedPw);

                return db.editUserPw(
                    req.session.userId,
                    req.body.firstname,
                    req.body.lastname,
                    req.body.email,
                    hashedPw
                );
            })
            .then(() => {
                console.log("edit ran");
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error in editUserPw", err);
            });
    } else {
        db.editUserNoPw(
            req.session.userId,
            req.body.firstname,
            req.body.lastname,
            req.body.email
        );
        db.upsertProfile(
            req.session.userId,
            req.body.age,
            req.body.city,
            req.body.url
        )
            .then(() => {
                return res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error in upsert or editUserNoPw", err);
            });
    }
});

// // --LOGIN
app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        title: "login",
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    const errLogin = true;
    const email = req.body.email;
    const password = req.body.password;

    db.loginUser(req.body.email).then((result) => {
        //  console.log("result:", result);
        let hashedPw = result.rows[0].password;
        return compare(password, hashedPw)
            .then((match) => {
                console.log("match value from compare:", match);
                if (match == true) {
                    req.session.userId = result.rows[0].id;

                    db.findSignature(req.session.userId).then((result) => {
                        console.log("result findSignature:", result);
                        req.session.signatureId = result.rows[0].id;
                        // if (result.rows.signature) {
                        if (req.session.signatureId) {
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    });
                } else {
                    res.render("login", {
                        layout: "main",
                        title: "login",
                        errLogin,
                    });
                }
            })
            .catch((err) => console.log("err in compare:", err));
    });
});

// -- PETITION

app.get("/petition", requireLoggedInUser, requireNoSignature, (req, res) => {
    console.log(req.session.signatureId);

    res.render("petition", {
        layout: "main",
        title: "Petition",
    });
});

app.post("/petition", (req, res) => {
    //   console.log("req.body:", req.body);
    db.addSignature(req.body.signature, req.session.userId)
        .then(({ rows }) => {
            // console.log("id:", rows[0].id);
            // console.log("Supporter added");
            // setting the signature cookie
            req.session.signatureId = rows[0].id;
            console.log("req.session.signatureId:", req.session.signatureId);
            res.redirect("/thanks");
            return;
        })
        .catch((err) => {
            console.log("err in addSignature", err);
            const errInAddSignature = true;
            res.render("petition", {
                title: "petition",
                errInAddSignature,
            });
        });
});

app.get("/thanks", requireSignature, (req, res) => {
    db.findSignature(req.session.signatureId)
        .then((signature) => {
            // console.log("signature:", signature);
            return res.render("thanks", {
                layout: "main",
                title: "thanks",
                signature: signature.rows[0].signature,
            });
        })
        .catch((err) => {
            console.log("Error in getThanks:", err);
        });
});

app.post("/thanks", (req, res) => {
    if (req.session.signatureId) {
        db.deleteSignature(req.session.signatureId)
            .then(() => {
                req.session.signatureId = null;
                console.log(
                    "req.session.signature after delete:",
                    req.session.signatureId
                );
            })
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("Error in deleteSignature", err);
            });
    }
});

// -- Signers
app.get("/signers", requireSignature, (req, res) => {
    db.listSupporter()
        .then((result) => {
            //  console.log("result.rows:", result.rows);
            return res.render("signers", {
                title: "signers",
                layout: "main",
                listSupporter: result.rows,
            });
        })
        .catch((err) => {
            console.log("error in listSupporter:", err);
        });
});

app.get("/signers/:city", requireSignature, (req, res) => {
    db.signersCity(req.params.city)
        .then((result) => {
            console.log("result SignersCity:", result);
            console.log("result.rows:", result.rows);
            return res.render("signersCity", {
                title: req.params.city,
                //layout: "main",
                style: "/main.css",
                listSupporter: result.rows,
            });
        })
        .catch((err) => {
            console.log("err in signersCity:", err);
        });
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server listening")
);
