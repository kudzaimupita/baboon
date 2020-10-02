const multer = require('multer');
const sharp = require('sharp');
// const Review = require('../models/reviewModel');
// const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Refund = require('../models/refundModel');

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

exports.uploadProductImages = upload.fields([{ name: 'images', maxCount: 5 }]);

exports.resizeProductImagesArray = catchAsync(async (req, res, next) => {
  if (req.files === undefined) return next();
  if (!req.files.images) return next();

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `product-${req.user.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/refunds/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.createRefund = catchAsync(async (req, res, next) => {
  if (req.user) req.body.user = req.user.id;

  const refund = await Refund.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      refund
    }
  });
});

exports.getMyRefunds = catchAsync(async (req, res, next) => {
  const refunds = await Refund.find({ user: req.user.id });

  res.status(201).json({
    status: 'success',
    results: refunds.length,
    data: {
      refunds
    }
  });
});

exports.userRefund = catchAsync(async (req, res, next) => {
  const refunds = await Refund.aggregate([
    {
      $match: { resolved: false }
    },

    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'orders',
        localField: 'order',
        foreignField: '_id',
        as: 'order'
      }
    }
  ]);

  const refundMatch = refunds.filter(
    // eslint-disable-next-line eqeqeq
    refund => refund._id == req.params.refundId
  );

  res.status(200).json({
    status: 'success',
    data: { refundMatch }
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.resolveUserRefund = catchAsync(async (req, res, next) => {
  const refund = await Refund.findById(req.params.refundId);

  if (!refund)
    return next(new AppError(`There is no refund with that Id!`, 400));

  if (req.user) req.body.resolvedBy = req.user.id;
  if (req.user) req.body.resolvedOn = Date.now();
  req.body.resolved = true;

  const filteredBody = filterObj(
    req.body,
    'resolvedBy',
    'resolvedOn',
    'reasonForRejection',
    'status',
    'resolved',
    'amountRefunded'
  );

  if (!req.body) {
    return next(AppError('Please enter details', 400));
  }

  const updatedRefund = await Refund.findByIdAndUpdate(
    req.params.refundId,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      order: updatedRefund
    }
  });
});

exports.getAllRefunds = catchAsync(async (req, res, next) => {
  const refunds = await Refund.find().sort('createdOn resolved');

  res.status(201).json({
    status: 'success',
    results: refunds.length,
    data: {
      refunds
    }
  });
});
// exports.getAllRefunds = factory.getAll(Review);
// exports.getRefund = factory.getOne(Review);
// exports.createReview = factory.createOne(Review);
// exports.updateReview = factory.updateOne(Review);
// exports.deleteReview = factory.deleteOne(Review);
