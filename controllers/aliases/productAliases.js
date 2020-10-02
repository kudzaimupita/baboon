//top 10 products for a certain catergory
exports.aliasTopTours = (req, res, next) => {
  req.query.subcatergory = req.params.subCatergoryId;
  req.query.limit = '10';
  req.query.sort = '-ratingsAverage,-ratingsQuantity,price';

  next();
};
//top 10 plugs for a certain catergory
exports.aliasTopPlugs = (req, res, next) => {
  req.query.catergory = req.params.catergoryId;
  req.query.limit = '10';
  req.query.sort = '-ratingsAverage,-ratingsQuantity';
  next();
};
//
exports.getAllPlugsForACatergory = (req, res, next) => {
  req.query.catergory = req.params.catergoryId;
  req.query.sort = '-ratingsAverage,-ratingsQuantity';
  next();
};
exports.getAllProductsForASubCatergory = (req, res, next) => {
  req.query.SubCatergory = req.params.SubCatergoryId;
  req.query.sort = '-ratingsAverage,-ratingsQuantity';
  next();
};

exports.getAllProductsByPlug = (req, res, next) => {
  req.query.SubCatergory = req.params.SubCatergoryId;
  req.query.sort = '-ratingsAverage,-ratingsQuantity';
  next();
};
