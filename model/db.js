var mysql = require("mysql");

var pool = mysql.createPool({
  host: "tuxa.sme.utc",
  user: "sr10p077",
  password: "5P9fJX8bHhUu",
  database: "sr10p077",
});

module.exports = pool;
