const admin = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');

const db_url = "https://iodemo-5e8a1-default-rtdb.firebaseio.com/";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: db_url
});

const db = admin.database();

module.exports = db;
