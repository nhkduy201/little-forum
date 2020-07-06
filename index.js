var express = require("express");

var bodyParser = require("body-parser");

var cookieParser = require("cookie-parser");

var shortid = require("shortid");

var userRoute = require("./routes/user.route");

var authRoute = require("./routes/auth.route");

var productRoute = require("./routes/product.route");

var controller = require("./controllers/user.controller");

var authMiddleware = require("./middlewares/auth.middleware");

var port = 3000;

var app = express(); // init app

// for parsing application/json
app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// for signed cookie
var secretString = shortid.generate();
app.use(cookieParser(secretString));

// pug template engine
app.set("view engine", "pug");
app.set("views", "./views");

// public folder
app.use(express.static("public"));

app.get("/", authMiddleware.requireAuth, controller.homeIndexRender);

app.get("/about", authMiddleware.requireAuth, controller.aboutIndexRender);

app.use("/users", authMiddleware.requireAuth, userRoute);

app.use("/product", authMiddleware.requireAuth, productRoute);

app.use("/auth", authRoute);

app.use((req, res, next) => {
  res.status(404).render("./404");
});

app.listen(port, function () {
  console.log("Server listening on port " + port);
});
