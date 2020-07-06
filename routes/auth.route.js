var express = require("express");

var controller = require("../controllers/auth.controller");

var validate = require("../validate/signup.validate");

var upload = require("../middlewares/upload.avatar.middleware");

var router = express.Router();

router.get("/login", controller.login);

router.post("/login", controller.postLogin);

router.get("/signup", controller.signup);

router.get("/logout", controller.logout);

router.get("/forget-password/:step", controller.forgetPass);

router.post("/forget-password/:step", controller.postForgetPass);

router.post(
  "/signup",
  upload,
  validate.userCreateSuccess,
  controller.postSignup
);
module.exports = router;
