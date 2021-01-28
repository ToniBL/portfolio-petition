const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
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

// -- CREATE USER
app.get("/register", (req, res) => {
    if (!req.session.userId) {
        res.render("register", {
            layout: "main",
            title: "register",
        });
    } else if (req.session.userId && req.session.signatureId) {
        res.redirect("/thanks");
    } else if (req.session.userId) {
        res.redirect("/petition");
    }
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
            // console.log("result.rows[0].id:", result.rows[0].id);
            req.session.userId = result.rows[0].id;
            // return res.redirect("/petition");
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

app.get("/profile", (req, res) => {
    if (req.session.userId) {
        res.render("profile", {
            layout: "main",
            title: "profile",
        });
    } else {
        res.redirect("/register");
    }
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

app.get("/edit", (req, res) => {
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

// app.post("/edit", (req, res) => {
//     if (req.body.password != undefined) {
//         hash(req.body.password).then((hashedPw) => {
//             // console.log("hashedPw in register:", hashedPw);

//             return db.registerUser(
//                 req.body.firstname,
//                 req.body.lastname,
//                 req.body.email,
//                 hashedPw
//             );
//         }).then;
//     }
// });

// // --LOGIN
app.get("/login", (req, res) => {
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
                        if (result.rows.signature) {
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

app.get("/petition", (req, res) => {
    //console.log(req.session.signatureId);
    if (req.session.signatureId && req.session.userId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            title: "Petition",
        });
    }
});

app.post("/petition", (req, res) => {
    //   console.log("req.body:", req.body);

    db.addSignature(req.body.signature, req.session.userId)
        .then(({ rows }) => {
            // console.log("id:", rows[0].id);
            // console.log("Supporter added");

            req.session.signatureId = rows[0].id;
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

app.get("/thanks", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.signatureId) {
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
    }
});

// -- Signers
app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
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
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:city", (req, res) => {
    if (req.session.signatureId) {
        db.signersCity(req.params.city)
            .then((result) => {
                console.log("result SignersCity:", result);
                console.log("result.rows:", result.rows);
                return res.render("signersCity", {
                    title: req.params.city,
                    layout: "main",
                    listSupporter: result.rows,
                });
            })
            .catch((err) => {
                console.log("err in signersCity:", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server listening")
);
