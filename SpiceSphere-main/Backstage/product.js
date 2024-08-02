// 圖卡字太多會跑版

const express = require("express");
const mysql = require("mysql");
const ejs = require("ejs");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { log } = require("console");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(3000, function () {
    console.log("port 3000!");
});

app.set("view engine", "ejs");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "spicesphere_sql",
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
});

const product_common =
    "SELECT product.*, related.related_name AS related_name FROM product LEFT JOIN related ON product.related = related.related_uid";
app.get("/product", (req, res) => {
    let sql = product_common;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.render("productDemo", { items: result });
    });
});

app.use(express.static("../"));
app.use(express.static("jquery"));
app.use(express.static("CSS"));
