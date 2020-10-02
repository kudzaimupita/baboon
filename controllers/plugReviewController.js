const PlugReview = require('../models/plugReviewModel');
const Plug = require('../models/plugModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.setPlugUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.plug) req.body.plug = req.params.plugId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.plugReviewValidator = catchAsync(async (req, res, next) => {
  const review = await PlugReview.findById(req.params.id);
  // eslint-disable-next-line eqeqeq
  if (review.user._id != req.user.id) {
    return next(new AppError(`Not authorized to perform this action!`, 401));
  }

  next();
});

exports.getAllPlugReviews = catchAsync(async (req, res, next) => {
  const plugReviews = await PlugReview.find({ plug: req.params.plugId });

  if (!plugReviews) {
    return next(new AppError(`Oops, review doesnt exist!`, 404));
  }

  res.status(200).json({
    status: 'success',
    results: plugReviews.length,
    data: plugReviews
  });
});

exports.validPlugValidator = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.plugId);

  if (!plug) {
    return next(new AppError(`Oops, plug doesnt exist!`, 404));
  }

  next();
});

exports.getPlugReview = factory.getOne(PlugReview);
exports.createPlugReview = factory.createOne(PlugReview);
exports.updatePlugReview = factory.updateOne(PlugReview);
exports.deletePlugReview = factory.deleteOne(PlugReview);
