// 主控台輸入 npm i express mysql cors

var express = require("express")
var mysql = require("mysql")
var cors = require("cors")
var path = require("path")
var app = express()
app.listen(3100)

app.use(cors())

app.use(express.static(path.join(__dirname, 'public')))

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spicesphere_sql'
});

connection.connect(err => {
    if (err) {
        console.error('連接錯誤' + err.stack);
        return;
    }
    console.log('連接成功');
});

app.get('/api/product/:id', function (req, res) {
    connection.query(
        `SELECT * FROM product WHERE product_uid = ?`,
        [req.params.id], 
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error });
            }
            res.json(results);
        });
})

app.get('/data/product/:id', function(req, res) {
    res.sendFile(path.join(__dirname, './public/html', 'fewProductSection.html'));
})