//安裝  express mysql ejs path body-parser multer express-sion
const express = require("express");
const mysql = require("mysql");
const ejs = require("ejs");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const multer = require("multer");
const uploadRecipe = multer({ dest: "../img/recipe" });
const uploadProduct = multer({ dest: "../img/product" });
const session = require("express-session");

app.use(
  session({
    secret: "SpiceSphere20240827",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 如果您的網站使用 HTTPS，請將此選項設為 true
  })
);

app.use((req, res, next) => {
  res.locals.username = req.session.username || "請先登入";
  next();
});

app.set("views", path.join(__dirname, "views"));

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

//以上都是模組設定

////////////////////////////////////////////給前端渲染資料 食譜單頁

app.get("/api/recipe/:id", (req, res) => {
  let sql =
    "SELECT recipe.*, style.style_name AS style_name, related.related_name AS related_name, ingredients_for_recipe.* FROM recipe LEFT JOIN style ON recipe.style = style.style_uid LEFT JOIN related ON recipe.related = related.related_uid LEFT JOIN ingredients_for_recipe ON recipe.recipe_uid = ingredients_for_recipe.recipe_uid WHERE recipe.recipe_uid = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    let sql2 = "SELECT * FROM recipe ORDER BY RAND() LIMIT 3";
    db.query(sql2, (err2, result2) => {
      if (err2) throw err2;
      res.json({ items: result, recommendations: result2 });
    });
  });
});

////////////////////////////////////////商品搜索頁
app.get("/api/products", (req, res) => {
  let sql =
    "SELECT product.*, related.related_name AS related_name FROM product LEFT JOIN related ON product.related = related.related_uid";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.json({ items: result });
  });
});

//////////////////////////////////////////商品單頁

app.get("/api/product/:id", (req, res) => {
  let sql = "SELECT * FROM product WHERE product_uid = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    let sql2 =
      "SELECT * FROM product WHERE related = ? ORDER BY RAND() LIMIT 5";
    db.query(sql2, [result[0].related], (err2, result2) => {
      if (err2) throw err2;
      // 將產品和推薦的產品一起傳遞給前端
      res.json({ items: result[0], recommendations: result2 });
    });
  });
});

////////////////////////////////////////////

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    // 如果用戶已登入，則繼續處理請求
    next();
  } else {
    // 如果用戶未登入，則重定向到登入頁面
    res.redirect("/login");
  }
}

/////登入畫面

app.get("/login", (req, res) => {
  res.render("login", { username: req.session.username || "請先登入" });
});

app.post("/login", (req, res) => {
  const { staff_uid, password } = req.body;

  db.query(
    "SELECT * FROM staff WHERE staff_uid = ? AND password = ?",
    [staff_uid, password],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server error");
      }

      if (result.length > 0) {
        // 登入成功，將用戶資訊存入 session，並重定向到首頁
        req.session.user = result[0];
        req.session.username = result[0].staff_name; // 假設用戶名稱儲存在 username 屬性中
        res.redirect("/recipe");
      } else {
        // 登入失敗，重定向回登入頁面，並傳遞錯誤訊息
        res.render("login", {
          error: true,
          username: req.session.username || "請先登入",
        });
      }
    }
  );
});

//////登出
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/recipe");
    }
    res.clearCookie("sid");
    res.redirect("/login");
  });
});
app.use(express.static("../"));
app.use(express.static("jquery"));
app.use(express.static("CSS"));
app.use(ensureAuthenticated);

/////////////////////////////////////////////////////////////////////////////新增食譜項目
app.get("/addRecipe", (req, res) => {
  res.render("add_recipe");
});

let currentUid;

app.post("/addRecipe", function (req, res) {
  var data = req.body;

  var sql = "INSERT INTO recipe SET ?";
  db.query(sql, data, function (err, result) {
    if (err) {
      console.error(err);
      res.send("新增失敗，請檢查是否所有項目皆填寫!");
    } else {
      currentUid = result.insertId;
      res.json({ message: "食譜已成功新增！", uid: result.insertId });
    }
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../img/recipe");
  },
  filename: function (req, file, cb) {
    cb(null, "recipe" + currentUid + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/uploadImage", upload.single("file"), function (req, res) {
  res.send("圖片已成功上傳！");
});

app.post("/addIngredient", function (req, res) {
  var data = req.body;

  var sql = "INSERT INTO ingredients_for_recipe SET ?";
  db.query(sql, data, function (err, result) {
    if (err) {
      console.error(err);
      res.send("新增食材失敗，請檢查食材是否重複!");
    } else {
      res.json({ message: "食材已成功新增！", uid: result.insertId });
    }
  });
});
///////////////////////////////////////////////////////////////////////新增商品項目
let currentPid;

app.get("/addProduct", (req, res) => {
  res.render("add_product");
});

app.post("/addProduct", function (req, res) {
  var data = req.body;

  var sql = "INSERT INTO product SET ?";
  db.query(sql, data, function (err, result) {
    if (err) {
      console.error(err);
      res.send("新增失敗，請檢查是否所有項目皆填寫!");
    } else {
      currentPid = result.insertId;
      res.json({ message: "產品已成功新增！", pid: result.insertId });
    }
  });
});

const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../img/product");
  },
  filename: function (req, file, cb) {
    cb(null, "product" + currentPid + path.extname(file.originalname));
  },
});

const productUpload = multer({ storage: productStorage });

app.post(
  "/uploadProductImage",
  productUpload.single("file"),
  function (req, res) {
    res.send("產品圖片已成功上傳！");
  }
);

///////////////////////////////////////////////////////////////////////刪除項目
//////////////////////////////////////////////////////////////////////單個刪除
app.post("/deleteRecipe", function (req, res) {
  var uid = req.body.uid;

  var sql = "DELETE FROM ingredients_for_recipe WHERE recipe_uid = ?";
  db.query(sql, [uid], function (err, result) {
    if (err) {
      console.error(err);
      res.send("刪除失敗，請稍後再試！");
    } else {
      // 再刪除 recipe 表格中的資料
      sql = "DELETE FROM recipe WHERE recipe_uid = ?";
      db.query(sql, [uid], function (err, result) {
        if (err) {
          console.error(err);
          res.send("刪除失敗，請稍後再試！");
        } else {
          res.json({ message: "資料已成功刪除！" });
        }
      });
    }
  });
});

app.post("/deleteProduct", function (req, res) {
  var uid = req.body.uid;

  var sql = "DELETE FROM product WHERE product_uid = ?";
  db.query(sql, [uid], function (err, result) {
    if (err) {
      console.error(err);
      res.send("刪除失敗，請稍後再試！");
    } else {
      res.json({ message: "資料已成功刪除！" });
    }
  });
});
//////////////////////////////////////////////////////////////////////////批量刪除
app.post("/deleteRecipes", function (req, res) {
  var uids = req.body.uids;

  var sql = "DELETE FROM ingredients_for_recipe WHERE recipe_uid IN (?)";
  db.query(sql, [uids], function (err, result) {
    if (err) {
      console.error(err);
      res.send("刪除失敗，請稍後再試！");
    } else {
      sql = "DELETE FROM recipe WHERE recipe_uid IN (?)";
      db.query(sql, [uids], function (err, result) {
        if (err) {
          console.error(err);
          res.send("刪除失敗，請稍後再試！");
        } else {
          res.json({ message: "資料已成功刪除！" });
        }
      });
    }
  });
});

app.post("/deleteProducts", function (req, res) {
  var uids = req.body.uids;

  var sql = "DELETE FROM product WHERE product_uid IN (?)";
  db.query(sql, [uids], function (err, result) {
    if (err) {
      console.error(err);
      res.send("刪除失敗，請稍後再試！");
    } else {
      res.json({ message: "資料已成功刪除！" });
    }
  });
});

////////////////////////////////////編輯食譜頁面
app.get("/recipe/edit/:id", (req, res) => {
  let sql1 = "SELECT * FROM recipe WHERE recipe_uid = ?";
  let sql2 = "SELECT * FROM ingredients_for_recipe WHERE recipe_uid = ?";

  Promise.all([
    new Promise((resolve, reject) => {
      db.query(sql1, [req.params.id], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(sql2, [req.params.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
  ])
    .then(([recipe, ingredients]) => {
      res.render("edit_recipe", { items: recipe, ingredients: ingredients });
    })
    .catch((err) => {
      throw err;
    });
});

/////////////////////////////////////////////////編輯食譜功能
const uploadForEdit = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "../img/recipe");
    },
    filename: function (req, file, cb) {
      cb(null, "recipe" + req.params.id + path.extname(file.originalname));
    },
  }),
});

app.post("/recipe/edit/:id", uploadForEdit.single("file"), (req, res) => {
  let sql1 =
    "UPDATE recipe SET recipe_title = ?, part_describe = ?, full_describe = ?,step = ?,recipe_size = ?, preparation_time = ?, cook_time =? ,`when` = ? , style = ?, is_vege = ?, isKitchen = ?, related = ? WHERE recipe_uid = ?";
  let sql2 = "DELETE FROM ingredients_for_recipe WHERE recipe_uid = ?";
  let sql3 =
    "INSERT INTO ingredients_for_recipe (recipe_uid, ingredient_name, ingredient_quantity) VALUES ?";

  // 更新食譜表
  db.query(
    sql1,
    [
      req.body.recipe_title,
      req.body.part_describe,
      req.body.full_describe,
      req.body.step,
      req.body.size,
      req.body.prepare_time,
      req.body.cooking_time,
      req.body.when,
      req.body.style,
      req.body.is_vage,
      req.body.is_kitchen,
      req.body.related,
      req.body.recipe_uid,
    ],
    (err, result) => {
      if (err) throw err;
      // 刪除所有舊的食材
      db.query(sql2, [req.body.recipe_uid], (err, result) => {
        if (err) throw err;

        // 插入新的食材
        var ingredients = JSON.parse(req.body.ingredients);
        var values = ingredients.map((ingredient) => [
          req.body.recipe_uid,
          ingredient.ingredient_name,
          ingredient.ingredient_quantity,
        ]);
        db.query(sql3, [values], (err, result) => {
          if (err) throw err;
          res.send("食譜更新成功!");
        });
      });
    }
  );
});

/////////////////////////////////////////////////編輯商品頁面
app.get("/product/edit/:id", (req, res) => {
  let sql1 = "SELECT * FROM product WHERE product_uid = ?";
  db.query(sql1, [req.params.id], (err, result) => {
    if (err) {
      // 處理錯誤
      console.log(err);
    } else {
      res.render("edit_product", { items: result[0] });
    }
  });
});
//////////////////////////////////////////////////編輯商品功能
const uploadProudctEdit = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "../img/product");
    },
    filename: function (req, file, cb) {
      cb(null, "product" + req.params.id + path.extname(file.originalname));
    },
  }),
});

app.post("/product/edit/:id", uploadProudctEdit.single("file"), (req, res) => {
  let uid = req.params.id;
  let data = req.body;
  let sql1 =
    "UPDATE product SET product_title = ?, part_describe = ?, full_describe = ?,size = ?,price = ?, inventory = ?, sales_amount = ?, related = ? WHERE product_uid = ?";
  db.query(
    sql1,
    [
      data.product_title,
      data.part_describe,
      data.full_describe,
      data.size,
      data.price,
      data.inventory,
      data.sales_amount,
      data.related,
      uid,
    ],
    function (err, result) {
      if (err) {
        console.error(err);
        res.send("更新失敗，請稍後再試！");
      } else {
        res.json({ message: "資料已成功更新！" });
      }
    }
  );
});
/////////////////////recipe路由  recipe_common為SQL指令，讓recipe表連接style和related
const recipe_common =
  "SELECT recipe.*, style.style_name AS style_name, related.related_name AS related_name FROM recipe LEFT JOIN style ON recipe.style = style.style_uid LEFT JOIN related ON recipe.related = related.related_uid";
app.get("/recipe", (req, res) => {
  let sql = recipe_common;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("recipe", { items: result });
  });
});

app.get("/recipe/sort/recipe_uid", (req, res) => {
  let sql = recipe_common + " ORDER BY recipe.recipe_uid DESC;";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("recipe", { items: result });
  });
});

app.get("/recipe/sort/click", (req, res) => {
  let sql = recipe_common + " ORDER BY click DESC";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("recipe", { items: result });
  });
});

app.get("/recipe/sort/click_desc", (req, res) => {
  let sql = recipe_common + " ORDER BY click";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("recipe", { items: result });
  });
});

app.get("/recipe/sort", (req, res) => {
  let style = req.query.style;
  let sql = recipe_common + " WHERE style = ?";
  db.query(sql, [style], (err, result) => {
    if (err) throw err;
    res.render("recipe", { items: result, style: style });
  });
});

app.get("/recipe/:id", (req, res) => {
  let sql = "SELECT * FROM recipe WHERE recipe_uid = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    res.render("recipe_detail", { items: result[0] });
  });
});

//////////////////////////////product路由  product_common和食譜的作用一樣
const product_common =
  "SELECT product.*, related.related_name AS related_name FROM product LEFT JOIN related ON product.related = related.related_uid";
app.get("/product", (req, res) => {
  let sql = product_common;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/product_uid", (req, res) => {
  let sql = product_common + " ORDER BY product_uid DESC";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/click", (req, res) => {
  let sql = product_common + " ORDER BY click DESC";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/click_desc", (req, res) => {
  let sql = product_common + " ORDER BY click";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort", (req, res) => {
  let related = req.query.related;
  let sql = product_common + " WHERE related = ?";
  db.query(sql, [related], (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/sales_desc", (req, res) => {
  let sql = product_common + " ORDER BY sales_amount";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/sales", (req, res) => {
  let sql = product_common + " ORDER BY sales_amount DESC";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/sales_ratio", (req, res) => {
  let sql =
    "SELECT product.*, related.related_name AS related_name, IFNULL((product.sales_amount / product.click) * 100, 0) AS sales_ratio FROM product LEFT JOIN related ON product.related = related.related_uid ORDER BY sales_ratio DESC";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/sort/sales_ratio_desc", (req, res) => {
  let sql =
    "SELECT product.*, related.related_name AS related_name, IFNULL((product.sales_amount / product.click) * 100, 0) AS sales_ratio FROM product LEFT JOIN related ON product.related = related.related_uid ORDER BY sales_ratio";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("product", { items: result });
  });
});

app.get("/product/:id", (req, res) => {
  let sql = "SELECT * FROM product WHERE product_uid = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    res.render("product_detail", { items: result[0] });
  });
});

//搜尋系統
app.get("/search", (req, res) => {
  let table = req.query.search; // 從查詢參數中獲取要搜尋的表名
  let keyword = req.query.keyword; // 從查詢參數中獲取搜尋關鍵字

  // 根據表名決定要搜尋的欄位和 SQL 查詢
  let column, sql;
  if (table === "recipe") {
    column = "recipe_title";
    sql =
      "SELECT recipe.*, style.style_name AS style_name, related.related_name AS related_name FROM recipe LEFT JOIN style ON recipe.style = style.style_uid LEFT JOIN related ON recipe.related = related.related_uid WHERE recipe_title LIKE ? OR recipe_uid LIKE ? OR style_name LIKE ? OR related_name LIKE ?";
  } else {
    column = "product_title";
    sql =
      "SELECT product.*, related.related_name AS related_name FROM product LEFT JOIN related ON product.related = related.related_uid WHERE product_title LIKE ? OR product_uid LIKE ? OR related_name LIKE ?";
  }

  // 執行 SQL 查詢
  db.query(
    sql,
    [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`],
    (err, result) => {
      if (err) throw err;

      // 根據表名決定要渲染的模板
      let template = table === "recipe" ? "recipe" : "product";

      // 渲染模板並傳遞搜尋結果
      res.render(template, { items: result });
    }
  );
});
app.use(express.static("../"));
app.use(express.static("jquery"));
app.use(express.static("CSS"));
