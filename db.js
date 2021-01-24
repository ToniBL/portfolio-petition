// this module holds all queries we run to talk to database
// spiced-pg for communication between node and postgres

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// last part of path = name of databank -> create a new databank

module.exports.addSupporter = (firstname, lastname, signature) => {
    //console.log(firstname, lastname, signature);
    const q = `INSERT INTO signatures (first, last, signature) 
    VALUES ($1, $2, $3)
    RETURNING id
    `;
    const params = [firstname, lastname, signature];
    return db.query(q, params);
};

module.exports.findSignature = (signature) => {
    const q = `SELECT signature FROM signatures WHERE id = ($1)`;
    const params = [signature];
    return db.query(q, params);
};

module.exports.listSupporter = () => {
    const q = `SELECT firstname, lastname FROM signatures`;
    console.log(q);
    //VALUES ($1, $2)`;
    //const params = [firstname, lastname];
    return db.query(q);
};
