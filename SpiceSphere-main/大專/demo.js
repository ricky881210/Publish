var express = require("express")
var mysql = require("mysql")
var cors = require("cors")
var app = express()
app.listen(3100)

app.use(cors())

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

app.get('/data/ingredients_for_recipe', function (req, res) {
    // let sql = '' ;
    // let tables = ['ingredient', 'ingredients_for_recipe', 'member', 'product', 'product_commemt', 'recipe', 'recipe_rating', 'related', 'sales_history', 'style', 'when']
    // tables.forEach(function(table, index){
    //     if(index > 0){
    //         sql += ' UNION ALL ';
    //     }
    //     sql += `SELECT * FROM ${table}`;
    // })
    connection.query(
        `SELECT 
            recipe_uid,
            GROUP_CONCAT(ingredient_name SEPARATOR ', ') AS ingredient_name
        FROM 
            ingredients_for_recipe
        GROUP BY 
            recipe_uid`
        , (error, results) => {
            if (error) {
                return res.status(500).json({ error: error });
            }
            res.json(results);
        });
});

app.get('/data/product', function (req, res) {
    connection.query(
        'SELECT * FROM product'
        , (error, results) => {
            if (error) {
                return res.status(500).json({ error: error });
            }
            res.json(results);
        });
})

app.get('/data/recipe', function (req, res) {
    connection.query(
        'SELECT * FROM recipe'
        , (error, results) => {
            if (error) {
                return res.status(500).json({ error: error });
            }
            res.json(results);
        });
})




        
       