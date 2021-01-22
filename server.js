const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// app.use(
//     cookieSession({
//         secret: secrets.sessionSecret,
//         maxAge: 1000 * 60 * 60 * 24 * 14,
//     })
// );
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
    if (req.cookies.signed) {
        //req.session.signatureId = true
        //res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            title: "Petition",
        });
    }
});

app.post("/petition", (req, res) => {
    const errInAddSupporter = true;
    console.log("req.body:", req.body);

    db.addSupporter(req.body.firstname, req.body.lastname, req.body.signature)
        .then(() => {
            console.log("Supporter added");
            // req.session.signatureId = results.rows[0].id
            // res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err in addSupporter", err);
            res.redirect("/petition", {
                errInAddSupporter,
            });
        });
    res.redirect("/petition"); // this needs to be redirect to thank you, redirects to petition oly for testing purpose
});

app.get("/thanks", (req, res) => {
    // if (req.session.signatureId)
    // pull id out of req.session.signatureId and write a function that does a query to find the signature by id in db
    res.render("thanks", {
        layout: "main",
        title: "thanks",
    });
    // else {
    //      res.redirect("/petition)
    // }
});

app.get("/signers", (req, res) => {
    // if (req.session.signatureId == false)
    res.redirect("/petition");
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
