module.exports.userCreateSuccess = function (req, res, next) {
  var errors = ["", "", "", "", ""];

  if (!req.body.name) {
    errors[0] = "Name is required!";
  }

  if (!req.body.phone) {
    errors[1] = "Phone is required!";
  } else if (
    req.body.phone
      .split("")
      .filter((ch) => ch.codePointAt(0) < 48 || ch.codePointAt(0) > 57).length
  ) {
    errors[1] = "Phone just contain number!";
  }
  if (!req.body.email) {
    errors[2] = "Email is required!";
  } else if (
    !req.body.email.split("").filter((ch) => {
      return ch === "@";
    }).length
  ) {
    errors[2] = "Email is illegal!";
  }
  if (!req.body.password) {
    errors[3] = "Password is required!";
  } else if (
    req.body.password
      .split("")
      .filter(
        (ch) =>
          !(
            (ch.codePointAt(0) >= 48 && ch.codePointAt(0) <= 57) ||
            (ch.codePointAt(0) >= 65 && ch.codePointAt(0) <= 90) ||
            (ch.codePointAt(0) >= 97 && ch.codePointAt(0) <= 122)
          )
      ).length
  ) {
    errors[3] = "Password is illegal!";
  } else if (req.body.password !== req.body.confirmPassword) {
    errors[4] = "Password and confirm password not matched!";
  }
  if (!req.body.confirmPassword) {
    errors[4] = "Confirm password is required!";
  }
  var checkErrors = errors.filter((error) => {
    return error.length;
  });
  if (checkErrors.length) {
    res.locals.reqErrorObj = {
      errors: errors,
      values: req.body,
    };
  }
  next();
};
