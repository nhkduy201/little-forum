require("dotenv").config();

var db = require("../db");

var shortid = require("shortid");

var bcrypt = require("bcrypt");

var saltRounds = 10;

var nodemailer = require("nodemailer");

var smtpTransport = require("nodemailer-smtp-transport");

const Jimp = require("jimp");

module.exports.login = function (req, res) {
  res.render("auth/login", {
    users: db.get("users").value(),
  });
};
module.exports.postLogin = function (req, res) {
  var email = req.body.email;
  var rawPassword = req.body.password;
  var user = db.get("users").find({ email: email }).value();
  var errors = ["", ""];
  if (!email) {
    errors[0] = "Email is required!";
  } else if (email.indexOf("@") == -1) {
    errors[0] = "Email is illegal!";
  } else if (!user) {
    errors[0] = "Account not found!";
  }
  if (!rawPassword) {
    errors[1] = "Password is required!";
  } else {
    if (user) {
      bcrypt.compare(rawPassword, user.password).then(function (result) {
        if (!result) {
          errors[1] = "Wrong password!";
        }
      });
    }
  }

  var checkErrors = errors.filter((error) => {
    return error.length;
  });

  if (checkErrors.length) {
    res.render("auth/login", {
      errors: errors,
      values: req.body,
    });
    return;
  }
  res.cookie("userId", user.id, {
    signed: true,
  });
  res.redirect("/users");
};

module.exports.signup = function (req, res) {
  res.render("auth/signup");
};

module.exports.postSignup = async function (req, res) {
  req.body.id = shortid.generate();
  req.body.avatar = req.file.path.split("\\").slice(1).join("/");
  await Jimp.read("./public/" + req.body.avatar)
    .then((image) => {
      if (image.bitmap.width === image.bitmap.height) {
        return;
      }
      const size =
        image.bitmap.width > image.bitmap.height
          ? image.bitmap.width
          : image.bitmap.height;
      image.cover(size, size).write("./public/" + req.body.avatar);
    })
    .catch((err) => {
      console.log(err);
    });
  delete req.body.confirmPassword;
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    // Now we can store the password hash in db.
    req.body.password = hash;
    db.get("users").unshift(req.body).write();
    res.redirect("/auth/login");
  });
};
module.exports.logout = function (req, res) {
  res.clearCookie("userId", {
    signed: true,
  });
  res.redirect("/");
};
module.exports.forgetPass = function (req, res) {
  if (req.params.step == "1") {
    res.render("auth/forget-password", { step: req.params.step });
    return;
  } else if (
    req.params.step == "2" &&
    req.signedCookies.user &&
    req.signedCookies.identifyCode
  ) {
    res.render("auth/forget-password", { step: req.params.step });
    return;
  } else if (
    req.signedCookies.user &&
    req.signedCookies.isConfirm &&
    req.params.step == "3"
  ) {
    res.render("auth/forget-password", { step: req.params.step });
    return;
  }
  res.redirect("/auth/login");
};
module.exports.postForgetPass = function (req, res) {
  var processStep = req.params.step;
  if (processStep == "1") {
    var forgetEmail = req.body.email;
    var user = db.get("users").find({ email: forgetEmail }).value();
    var identifyCode = shortid.generate();
    if (!user) {
      res.render("auth/forget-password", { step: processStep });
      return;
    }
    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smptp.gmail.com",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      })
    );
    var emailContent = `<div style=" box-sizing: border-box; --blue: #007bff; --indigo: #6610f2; --purple: #6f42c1; --pink: #e83e8c; --red: #dc3545; --orange: #fd7e14; --yellow: #ffc107; --green: #28a745; --teal: #20c997; --cyan: #17a2b8; --white: #fff; --gray: #6c757d; --gray-dark: #343a40; --primary: #007bff; --secondary: #6c757d; --success: #28a745; --info: #17a2b8; --warning: #ffc107; --danger: #dc3545; --light: #f8f9fa; --dark: #343a40; --breakpoint-xs: 0; --breakpoint-sm: 576px; --breakpoint-md: 768px; --breakpoint-lg: 992px; --breakpoint-xl: 1200px; --font-family-sans-serif: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; position: relative; display: -ms-flexbox; display: flex; -ms-flex-direction: column; flex-direction: column; min-width: 0; word-wrap: break-word; background-color: #fff; background-clip: border-box; border: 1px solid rgba(0, 0, 0, 0.125); border-radius: 0.25rem; text-align: center; "><div style=" box-sizing: border-box; -ms-flex: 1 1 auto; flex: 1 1 auto; padding: 1.25rem; " > <h5 style=" box-sizing: border-box; margin-top: 0; font-weight: 500; line-height: 1.2; font-size: 1.25rem; margin-bottom: 0.75rem; " > Here is your code </h5> <div style=" box-sizing: border-box; position: relative; padding: 0.75rem 1.25rem; margin-bottom: 1rem; border: 1px solid transparent; border-radius: 0.25rem; color: #155724; background-color: #d4edda; border-color: #c3e6cb; width: 25rem; margin-right: auto; margin-left: auto; " role="alert" > ${identifyCode} </div></div></div>`;
    var mailOptions = {
      from: "noreplyanyreason@gmail.com",
      to: user.email,
      subject: "Reset Password Awesome Page",
      html: emailContent,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        res.cookie("user", JSON.stringify(user), { signed: true });
        res.cookie("identifyCode", identifyCode, { signed: true });
        processStep = (parseInt(processStep) + 1).toString();
        var nextPath = "/auth/forget-password/" + processStep;
        res.redirect(nextPath);
      }
    });
  } else if (processStep == "2") {
    var userCode = req.body.code;
    if (userCode !== req.signedCookies.identifyCode) {
      res.render("auth/forget-password", {
        errors: ["Your code is wrong."],
        step: processStep,
      });
      return;
    }
    res.cookie("isConfirm", true, { signed: true });
    processStep = (parseInt(processStep) + 1).toString();
    var nextPath = "/auth/forget-password/" + processStep;
    res.redirect(nextPath);
  } else if (processStep == "3") {
    var errors = ["", ""];
    var user = JSON.parse(req.signedCookies.user);
    if (!req.body.new) {
      errors[0] = "New password is required!";
    }
    if (!req.body.confirm) {
      errors[1] = "Confirm password is required!";
    } else if (req.body.new !== req.body.confirm) {
      errors[1] = "Password and confirm password not matched!";
    }

    var checkErrors = errors.filter((error) => {
      return error.length;
    });

    if (checkErrors.length) {
      res.render("auth/forget-password", {
        errors: errors,
        step: processStep,
      });
      return;
    }
    res.clearCookie("identifyCode", {
      signed: true,
    });
    res.clearCookie("isConfirm", {
      signed: true,
    });
    bcrypt.hash(req.body.new, saltRounds, (err, hash) => {
      db.get("users").find({ id: user.id }).assign({ password: hash }).write();
      res.clearCookie("user", {
        signed: true,
      });
      res.redirect("/auth/login");
    });
  }
};
/* <div
  class="card"
  style="
    box-sizing: border-box;
    --blue: #007bff;
    --indigo: #6610f2;
    --purple: #6f42c1;
    --pink: #e83e8c;
    --red: #dc3545;
    --orange: #fd7e14;
    --yellow: #ffc107;
    --green: #28a745;
    --teal: #20c997;
    --cyan: #17a2b8;
    --white: #fff;
    --gray: #6c757d;
    --gray-dark: #343a40;
    --primary: #007bff;
    --secondary: #6c757d;
    --success: #28a745;
    --info: #17a2b8;
    --warning: #ffc107;
    --danger: #dc3545;
    --light: #f8f9fa;
    --dark: #343a40;
    --breakpoint-xs: 0;
    --breakpoint-sm: 576px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 992px;
    --breakpoint-xl: 1200px;
    --font-family-sans-serif: -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
      'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
      'Noto Color Emoji';
    --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
    position: relative;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-direction: column;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
  "
>
  <div
    class="card-header"
    style="
      box-sizing: border-box;
      padding: 0.75rem 1.25rem;
      margin-bottom: 0;
      background-color: rgba(0, 0, 0, 0.03);
      border-bottom: 1px solid rgba(0, 0, 0, 0.125);
      border-radius: calc(0.25rem - 1px) calc(0.25rem - 1px) 0 0;
    "
  >
    Featured
  </div>
  <div
    class="card-body"
    style="
      box-sizing: border-box;
      -ms-flex: 1 1 auto;
      flex: 1 1 auto;
      padding: 1.25rem;
    "
  >
    <h5
      class="card-title"
      style="
        box-sizing: border-box;
        margin-top: 0;
        font-weight: 500;
        line-height: 1.2;
        font-size: 1.25rem;
        margin-bottom: 0.75rem;
      "
    >
      Special title treatment
    </h5>
    <p
      class="card-text"
      style="box-sizing: border-box; margin-top: 0; margin-bottom: 1rem;"
    >
      With supporting text below as a natural lead-in to additional content.
    </p>
    <a
      href="#"
      class="btn btn-primary"
      style="
        box-sizing: border-box;
        text-decoration: none;
        display: inline-block;
        font-weight: 400;
        text-align: center;
        vertical-align: middle;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        border: 1px solid transparent;
        padding: 0.375rem 0.75rem;
        font-size: 1rem;
        line-height: 1.5;
        border-radius: 0.25rem;
        transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
          border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        color: #fff;
        background-color: #007bff;
        border-color: #007bff;
      "
      >Go somewhere</a
    >
  </div>
</div> */
