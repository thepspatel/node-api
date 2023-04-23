const {DB_HOST, DB_USER, DB_PASSWORD, DB_NAME} = process.env

var mysql = require('mysql2');

var conn = mysql.createConnection({
    host:DB_HOST,
    user:DB_USER,
    password:DB_PASSWORD,
    database:DB_NAME,
});

conn.connect(function(err){
    if(err) throw err;
    console.log('Connection has been established successfully!');
});

module.exports = conn;