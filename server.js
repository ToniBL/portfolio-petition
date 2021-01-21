const express = require("express");
const app = express();
const db = require("./db");
const cookieParser = require("cookie-parser"); // needs to be exchanged with cookie-session
const hb = require("express-handlebars");

app.engine("handlebars", hb({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(cookieParser());

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
}); // prevents from loading into iframes

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

// app.get("/actors", (rq, res) => {
//     db.getActors()
//         .then((results) => {
//             console.log("resultsfrom getActors", results.row);
//         })
//         .catch((err) => {
//             console.log("error in getActors:", err);
//         });
// });

app.get("/petition", (req, res) => {
    if (req.cookies.signed) {
        //res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            title: "Petition",
        });
    }
});

app.post("/petition", (req, res) => {
    const errAddSupporter = true;
    console.log("req.body:", req.body);

    db.addSupporter(req.body.firstname, req.body.lastname, req.body.signature)
        .then(() => {
            console.log("Supporter added");
            // res.cookie("signed", 1); -> now with session cookies
            // res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err in addSupporter", err);
            res.redirect("/petition", {
                title: "sign",
                errAddSupporter,
            });
        });
    res.redirect("/petition");
});

app.get("/thanks", (req, res) => {
    res.render("thanks", {
        layout: "main",
        title: "thanks",
    });
});

app.get("/signers", (req, res) => {
    res.redirect("/petition");
});

app.listen(8080, () => console.log("petition server lisening"));
