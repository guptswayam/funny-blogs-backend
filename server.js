let mysql= require("mysql");
let dotenv= require("dotenv");
dotenv.config({
    path: "./config.env"
})


// we are using create pool instead of create connection because in pool we can have multiple connections and in create connection we can only have one connection to the database
// this is beneficial when many users visiting the app at the same time
// in pool connection are automatically opened and closed
// so,in pool we can query the database multiple times at the same time
// createconnection is generally faster than create pool if one request is coming at a time because we are not opening a new connection, and single connection is remained opened so we are saving time of opening a connection
// for more, visit https://stackoverflow.com/questions/26432178/what-is-the-difference-between-mysql-createconnection-and-mysql-createpool-in-no and https://stackoverflow.com/questions/41513128/node-mysql-execute-multiple-queries-the-fastest-possible


let connection= mysql.createPool({
    connectionLimit: 9,     //maximum connections to the database
    waitForConnections: true,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true
})

// connection.connect(function(err){
//     if(err) throw err;
//     console.log("Database connection successfull...");
// })

connection.getConnection(function(err,conn){
    if (err) {
        console.log(err);
    }
    else{
        console.log("connected..");
    }
    // conn.release();
})

console.log(connection._allConnections.length);         // to check how many connections are open, this line not needs any connection to execute

module.exports = connection;

let app= require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log("Server started at port 5000");
})

// every pool connection closed afer 1 minute and takes 1s for opening a connection
// uncomment th below code, when you want that your pool connection will never closed. So, we save the time for opening a connection if no request comes in the span of 60s
/*
setInterval(function () {
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
    connection.query('SELECT 1');
}, 55000);
*/