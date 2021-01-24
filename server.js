const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const csurf = require("csurf");
const secrets = require("./secrets.json");

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

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

app.post("/petition", (req, res) => {
    const errInAddSupporter = true;
    //   console.log("req.body:", req.body);

    db.addSupporter(req.body.firstname, req.body.lastname, req.body.signature)
        .then(({ rows }) => {
            // console.log("id:", rows[0].id);
            // console.log("Supporter added");

            req.session.signatureId = rows[0].id;
            res.redirect("/thanks");
            return;
        })
        .catch((err) => {
            console.log("err in addSupporter", err);
            res.redirect("/petition", {
                errInAddSupporter,
            });
        });
});

app.get("/thanks", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.signatureId) {
        db.findSignature(req.session.signatureId)
            .then((signature) => {
                // console.log("signature:", signature.rows[0].signature);
                res.render("thanks", {
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

app.get("/signers", (req, res) => {
    if (req.session.SignatureId) {
        db.listSupporter()
            .then((result) => {
                console.log("result.rows:", result.rows);
                res.render("signers", {
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

app.listen(8080, () => console.log("petition server lisening"));

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
