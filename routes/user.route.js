var express = require("express");

var controller = require("../controllers/user.controller");

var router = express.Router();

var shortid = require("shortid");

var upload = require("../middlewares/upload.avatar.middleware");

router.get("/cookie", function (req, res, next) {
  res.cookie("user-id", shortid.generate());
  res.send("<h1>Set cookie successfully!</h1>");
});
router.get("/", controller.userIndexRender);

router.get("/search", controller.userSearch);

router.get("/view/:id", controller.userView);

router.post("/view/:id", upload, controller.postChangeAvatar);

router.get("/change-password", controller.changePassword);

router.post("/change-password", controller.postChangePassword);

module.exports = router;
