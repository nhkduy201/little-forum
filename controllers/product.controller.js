var db = require("../db");

module.exports.productIndexRender = function (req, res) {
  var page = parseInt(req.params.page) || 1;
  let perPage = 8;
  var start = perPage * (page - 1);
  var end = start + perPage;
  var position;
  var allProducts = db.get("products").value();
  var productsPerPage = allProducts.slice(start, end);
  var lastPage = Math.ceil(allProducts.length / perPage);
  if (page == 1) {
    position = "top";
  } else if (page == Math.ceil(allProducts.length / perPage)) {
    position = "bot";
  }
  res.render("products/index", {
    products: productsPerPage,
    currentPage: page,
    position: position,
    lastPage: lastPage
  });
};
module.exports.postPageIndexRender = function(req, res) {
  let page = parseInt(req.body.page) || 1;
  let numberProduct = db.get("products").value().length;
  let perPage = 8;
  if(page * perPage > numberProduct) page = Math.ceil(numberProduct / perPage);
  else if(page < 1) page = 1;
  res.redirect("/product/" + page);
}