const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Product = require('../models/productModel');

exports.setProductUserIds = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.ReviewValidator = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  // eslint-disable-next-line eqeqeq
  if (review.user._id != req.user.id) {
    return next(new AppError(`Not authorized to perform this action!`, 401));
  }

  next();
});

exports.validProductValidator = catchAsync(async (req, res, next) => {
  const plug = await Product.findById(req.params.id);

  if (!plug) {
    return next(new AppError(`Oops, document doesnt exist!`, 404));
  }

  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
