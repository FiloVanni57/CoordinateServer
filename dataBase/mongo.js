require('dotenv').config();
const { MongoClient } = require('mongodb');

const connURI = process.env.MONGO_URI;
// const client = new MongoClient(connURI);
const client = new MongoClient(connURI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
});

let dataBase;

async function connettiDB() {
    if (dataBase) return dataBase;

    try {
        await client.connect();
        dataBase = client.db();
        console.log("Connesso a MongoDB");
        return dataBase;
    } catch (err) {
        console.error("Errore nella connesione al DB ", err);
        throw err;
    }
}

module.exports = connettiDB;