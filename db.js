// this module holds all queries we run to talk to database
// spiced-pg for communication between node and postgres

const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);
// last part of path = name of databank -> create a new databank

module.exports.addSignature = (signature, userId) => {
    //console.log(firstname, lastname, signature);
    const q = `INSERT INTO signatures (signature, user_id) 
    VALUES ($1, $2)
    RETURNING id
    `;
    const params = [signature, userId];
    return db.query(q, params);
};

module.exports.findSignature = (signature) => {
    const q = `SELECT signature FROM signatures WHERE id = $1`;
    const params = [signature];
    return db.query(q, params);
};

module.exports.listSupporter = () => {
    const q = `SELECT first, last FROM users`;
    // console.log(q);
    //VALUES ($1, $2)`;
    // const params = [first, last];
    return db.query(q);
};

module.exports.registerUser = (firstname, lastname, email, password) => {
    const q = `INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id`;
    const params = [firstname, lastname, email, password];
    return db.query(q, params);
};

module.exports.loginUser = (email) => {
    const q = `SELECT * FROM users WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};

module.exports.addProfile = (age, city, url, userId) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id`;
    const params = [age, city, url, userId];
    return db.query(q, params);
};
