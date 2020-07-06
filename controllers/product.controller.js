var db = require("../db");

module.exports.productIndexRender = function (req, res) {
  var page = parseInt(req.params.page);
  var perPage = 8;
  var start = perPage * (page - 1);
  var end = start + perPage;
  var position;
  var allProducts = db.get("products").value();
  var productsPerPage = allProducts.slice(start, end);
  if (page == 1) {
    position = "top";
  } else if (page == Math.ceil(allProducts.length / perPage)) {
    position = "bot";
  }
  res.render("products/index", {
    products: productsPerPage,
    currentPage: page,
    position: position,
  });
};
