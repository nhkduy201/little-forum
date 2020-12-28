var db = require("../db");

var bcrypt = require("bcryptjs");

var saltRounds = 10;

var cookieParser = require("cookie-parser");

var fs = require("fs");

const { render } = require("pug");

const Jimp = require("jimp");

const removeAccents = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

module.exports.homeIndexRender = function (req, res) {
  res.render("index", {
    old: 19,
    adminName: "Dev",
  });
};

module.exports.aboutIndexRender = function (req, res) {
  res.render("about");
};

module.exports.userIndexRender = function (req, res) {
  res.render("users/index", {
    users: db.get("users").value(),
  });
};

module.exports.userSearch = function (req, res) {
  var value = req.query.search;
  var users = db.get("users").value();
  var matchedUsers;
  matchedUsers = users.filter(function (user) {
    let name = removeAccents(user.name);
    return (
      name
        .toLocaleLowerCase()
        .indexOf(removeAccents(value).toLocaleLowerCase()) !== -1 ||
      user.phone
        .toLocaleLowerCase()
        .indexOf(removeAccents(value).toLocaleLowerCase()) !== -1 ||
      user.age.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) !== -1
    );
  });
  res.render("users/index", {
    users: matchedUsers,
    value: value,
  });
};

module.exports.userView = function (req, res) {
  var id = req.params.id;
  var user = res.locals.user;
  //var user = db.get("users").find({ id: res.locals.user.id }).value();
  var viewUser = db.get("users").find({ id: id }).value();
  if (!viewUser) {
    res.status(404).render("./404");
    return;
  }
  if (!viewUser.avatar) {
    viewUser.avatar = "images/base-avatar.png";
  }
  var selfViewing = true;
  if (user.id != viewUser.id) {
    selfViewing = false;
  }
  res.render("users/info", {
    viewUser: viewUser,
    selfViewing: selfViewing,
    confirm: false,
  });
};

module.exports.postChangeAvatar = async function (req, res) {
  var changeStatus = req.body.isConfirm;
  var user = res.locals.user;
  var newAvatarPath;
  if (req.file) {
    newAvatarPath = req.file.path.split("/").slice(1).join("/");
  } else {
    if (changeStatus == -1) {
      if (user.tmpAvatarPath) {
        try {
          await fs.unlink("./public/" + user.tmpAvatarPath, (err) => {
            if (err) throw err;
          });
        } catch (err) {
          console.log(err);
        }
        delete user.tmpAvatarPath;
      }
      res.render("users/info", {
        viewUser: user,
        selfViewing: true,
        confirm: false,
        isImage: false,
      });
      return;
    }
  }
  if (changeStatus == -1) {
    if (user.tmpAvatarPath) {
      try {
        await fs.unlink("./public/" + user.tmpAvatarPath, (err) => {
          if (err) throw err;
        });
      } catch (err) {
        console.log(err);
      }
    }
    user.tmpAvatarPath = newAvatarPath;
    var tmpUser = { ...user };
    tmpUser.avatar = newAvatarPath;
    await Jimp.read("./public/" + tmpUser.avatar)
      .then((image) => {
        if (image.bitmap.width === image.bitmap.height) {
          return;
        }
        const size =
          image.bitmap.width > image.bitmap.height
            ? image.bitmap.width
            : image.bitmap.height;
        image.cover(size, size).write("./public/" + tmpUser.avatar);
      })
      .catch((err) => {
        console.log(err);
      });
    res.render("users/info", {
      viewUser: tmpUser,
      selfViewing: true,
      confirm: true,
    });
    return;
  }
  if (changeStatus == 0) {
    if (user.tmpAvatarPath) {
      try {
        await fs.unlink("./public/" + user.tmpAvatarPath, (err) => {
          if (err) throw err;
        });
      } catch (err) {
        console.log(err);
      }
      delete user.tmpAvatarPath;
    }
    res.render("users/info", {
      viewUser: user,
      selfViewing: true,
      confirm: false,
    });
    return;
  }
  if (changeStatus == 1) {
    if (user.avatar != "images/base-avatar.png") {
      try {
        await fs.unlink("./public/" + user.avatar, (err) => {
          if (err) throw err;
        });
      } catch (err) {
        console.log(err);
      }
    }
    user.avatar = user.tmpAvatarPath;
    delete user.tmpAvatarPath;
    db.get("users")
      .find({ id: user.id })
      .assign({ avatar: user.avatar })
      .write();
    res.redirect("/users/view/" + user.id);
  }
};

module.exports.changePassword = function (req, res) {
  res.render("users/change-password.pug");
};

module.exports.postChangePassword = async function (req, res) {
  var errors = ["", "", ""];
  var user = db.get("users").find({ id: req.signedCookies.userId }).value();
  var oldCompareResult;
  if (!req.body.old) {
    errors[0] = "Old password is required!";
  } else {
    try {
      oldCompareResult = await bcrypt.compare(req.body.old, user.password);
    } catch (err) {
      console.log(err);
    }
    if (!oldCompareResult) {
      errors[0] = "Old password is wrong!";
    }
  }
  if (!req.body.new) {
    errors[1] = "New password is required!";
  }
  if (!req.body.confirm) {
    errors[2] = "Confirm password is required!";
  } else if (req.body.new !== req.body.confirm) {
    errors[2] = "Password and confirm password not matched!";
  }

  var checkErrors = errors.filter((error) => {
    return error.length;
  });

  if (checkErrors.length) {
    res.render("users/change-password", {
      errors: errors,
    });
    return;
  }
  bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(req.body.new, salt, function(err, hash) {
      db.get("users").find({ id: user.id }).assign({ password: hash }).write();
      res.redirect("/auth/login");
    });
  });
};
