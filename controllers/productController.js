const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types.ObjectId;

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Product = require('../models/productModel');
const factory = require('./handlerFactory');
const Plug = require('../models/plugModel');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload images only!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover) return next();

  req.body.imageCover = `product-${req.params.plugId}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${req.body.imageCover}`);

  next();
});

exports.resizeProductImagesArray = catchAsync(async (req, res, next) => {
  if (req.files === undefined) return next();
  if (!req.files.images) return next();

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `product-${req.params.plugId}-${Date.now()}-${i +
        1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/products/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.productStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { ratingsAverage: { $gt: 3 } }
    },
    {
      $group: {
        _id: null,
        ratingsAvg: { $avg: '$ratingsAverage' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.isPlugAdminValidator = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.plugId);

  if (JSON.parse(JSON.stringify(plug.plugAdmin._id)) !== req.user.id) {
    return next(new AppError(`Not authorized to perform this action!`, 401));
  }
  if (req.params.id) {
    const product = await Product.findById(req.params.id);

    if (
      product.plug === null &&
      JSON.parse(JSON.stringify(product.plug._id)) !== req.params.plugId
    ) {
      return next(new AppError(`Not authorized to perform this action!`, 401));
    }
  }
  next();
});

exports.onlyApprovedPlugsPostProducts = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.plugId);

  if (plug.approved === false)
    return next(
      new AppError(
        `Not authorized to add products before you're approved!`,
        400
      )
    );

  next();
});

//Full text search
exports.searchProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find(
    { $text: { $search: req.query.q } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });

  const plugs = await Plug.find(
    { $text: { $search: req.query.q } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });

  res.status(200).json({
    status: 'success',
    totalResults: products.length + plugs.length,
    productResults: products.length,
    plugResults: plugs.length,
    data: {
      products,
      plugs
    }
  });
});

exports.productsTransactionDelete = catchAsync(async (req, res, next) => {
  if (req.body.plugId) {
    const products = await Product.find({
      plug: { _id: req.body.plugId }
    });
    if (products) await Product.deleteMany({ plug: { _id: req.body.plugId } });
  }

  next();
});

exports.randomProductsByCatergory = catchAsync(async (req, res, next) => {
  const products = await Product.aggregate([
    {
      $match: { catergory: ObjectId(req.params.id) }
    },
    { $sample: { size: 10 } }
  ]);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products
  });
});

exports.randomProductsByBrandname = catchAsync(async (req, res, next) => {
  const products = await Product.aggregate([
    {
      $match: { brandName: req.params.brand }
    },
    { $sample: { size: 10 } }
  ]);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products
  });
});

exports.userFeedProducts = catchAsync(async (req, res, next) => {
  const plugs = await Plug.aggregate([
    {
      $match: { followers: { $in: [ObjectId(req.user.id)] } }
    }
  ]);

  const plugIds = plugs.map(plug => plug._id);

  const newProducts = await Product.find({
    plug: plugIds
  }).sort({
    createdOn: -1
  });

  res.status(200).json({
    status: 'success',
    results: newProducts.length,
    data: newProducts
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: 'reviews'
  });

  if (!product) {
    return next(new AppError('Opps, product doesnt exist!', 404));
  }

  const similarProducts = await Product.aggregate([
    {
      $match: { subCatergory: product.subCatergory }
    },
    { $sample: { size: 5 } }
  ]);

  res.status(200).json({
    status: 'success',
    similarResults: similarProducts.length,
    data: {
      product,
      similarProducts
    }
  });
});

exports.getAllProducts = factory.getAll(Product);
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
