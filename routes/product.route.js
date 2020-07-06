var express = require("express");

var controller = require("../controllers/product.controller");

var router = express.Router();

router.get("/:page", controller.productIndexRender);

module.exports = router;
