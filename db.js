// this module holds all queries we run to talk to database
// spiced-pg for communication between node and postgres

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// last part of path = name of databank -> create a new databank

module.exports.addSupporter = (firstname, lastname, signature) => {
    const q = `INSERT INTO signatures (first, last, signature) 
    VALUES ($1, $2, $3);`;
    const params = [firstname, lastname, signature];
    return db.query(q, params);
};
