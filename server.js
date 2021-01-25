const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const csurf = require("csurf");
const secrets = require("./secrets.json");
const { hash, compare } = require("./bc");

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// -- MIDDLEWARE
app.use(
    cookieSession({
        secret: secrets.sessionSecret,
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
    } else if (req.sessions.userId) {
        res.redirect("/petition");
    }
});

app.post("/register", (req, res) => {
    hash(req.body.password)
        .then((hashedPw) => {
            console.log("hashedPw in register:", hashedPw);

            return db.registerUser(
                req.body.firstname,
                req.body.lastname,
                req.body.email,
                hashedPw
            );
        })
        .then((result) => {
            console.log("result.rows[0].id:", result.rows[0].id);
            req.sessions.userId = result.rows[0].id;
        })
        .catch((err) => console.log("err in registerUser:", err));
    const errInRegister = true;
    return res.render("/register", {
        layout: "main",
        title: "register",
        errInRegister,
    });
    console.log("nach promise");
    res.redirect("/petition");
});

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.render("login", {
            layout: "main",
            title: "login",
        });
    } else if (!req.session.userId) {
        res.redirect("/register");
    } else if (req.session.userId && req.session.signatureId) {
        res.redirect("/thanks");
    }
});

app.get("/petition", (req, res) => {
    //console.log(req.session.signatureId);
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            title: "Petition",
        });
    }
});

// app.post("/petition", (req, res) => {
//     //   console.log("req.body:", req.body);

//     db.addSignature(req.body.signature)
//         .then(({ rows }) => {
//             // console.log("id:", rows[0].id);
//             // console.log("Supporter added");

//             req.session.signatureId = rows[0].id;
//             res.redirect("/thanks");
//             return;
//         })
//         .catch((err) => {
//             console.log("err in addSignature", err);
//             const errInAddSupporter = true;
//             res.render("/petition", {
//                 title: "petition",
//                 errInAddSignature,
//             });
//         });
// });

app.get("/thanks", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.signatureId) {
        db.findSignature(req.session.signatureId)
            .then((signature) => {
                console.log("signature:", signature);
                res.render("thanks", {
                    layout: "main",
                    title: "thanks",
                    //  signature: signature.rows[0].signature,
                });
            })
            .catch((err) => {
                console.log("Error in getThanks:", err);
            });
    }
});

//
app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
        db.listSupporter(req.session.signatureId)
            .then((result) => {
                console.log("result.rows:", result.rows);
                return res.render("signers", {
                    title: "signers",
                    layout: "main",
                    listSupporter: result.rows,
                });
            })
            .catch((err) => {
                console.log("error in listSupporters:", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("petition server listening"));

//function from class to get data from db
// app.get("/actors", (rq, res) => {
//     db.getActors()
//         .then((results) => {
//             console.log("resultsfrom getActors", results.row);
//         })
//         .catch((err) => {
//             console.log("error in getActors:", err);
//         });
// });
