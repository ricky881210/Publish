const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

app.listen(3001, function () {
  console.log("port 3001!");
});

//////////////主頁
app.get("/home_page", (req, res) => {
  res.render("home_page");
});

///////////////食譜區
app.get("/recipe_section", (req, res) => {
  res.render("recipe_section");
});

///////////////食譜單頁
app.get("/recipe_section/recipe_page/:id", (req, res) => {
  fetch(`http://localhost:3000/api/recipe/${req.params.id}`)
    .then((response) => response.json())
    .then((data) => {
      res.render("recipe_page", data);
    });
});

/////////////商品區
app.get("/product_section", (req, res) => {
  fetch("http://localhost:3000/api/products")
    .then((response) => response.json())
    .then((data) => {
      res.render("product_section", data);
    });
});
//////////////商品單頁
app.get("/product_section/product_page/:id", (req, res) => {
  fetch(`http://localhost:3000/api/product/${req.params.id}`)
    .then((response) => response.json())
    .then((data) => {
      res.render("product_page", data);
    });
});

app.get("/payment", (req, res) => {
  res.render("payment");
});

app.use(express.static("../"));
app.use(express.static("jquery"));
app.use(express.static("CSS"));
// app.use(ensureAuthenticated);
