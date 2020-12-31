var express = require("express");

var controller = require("../controllers/product.controller");

var router = express.Router();

router.get("/", controller.productIndexRender);
router.get("/:page", controller.productIndexRender);
router.post("/", controller.postPageIndexRender);

module.exports = router;
