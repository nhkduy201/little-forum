var multer = require("multer");

var multerConf = {
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/uploads/");
    },
    filename: function (req, file, cb) {
      var extname = file.mimetype.split("/")[1];
      if (extname.startsWith("svg")) {
        extname = "svg";
      }
      cb(null, file.fieldname + "-" + Date.now() + "." + extname);
    },
  }),
  fileFilter: function (req, file, cb) {
    var isImage = file.mimetype.startsWith("image/");
    if (isImage) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
};

var upload = multer(multerConf).single("avatar");

module.exports = upload;
