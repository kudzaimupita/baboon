const multer = require('multer');
const sharp = require('sharp');

const Email = require('../utils/email');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Review = require('../models/reviewModel');
const PlugReview = require('../models/plugReviewModel');

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

exports.uploadUserImages = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'imageCover', maxCount: 1 }
]);

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.files.photo) return next();

  req.body.photo = `user-${req.user.id}-${Date.now()}-photo.jpeg`;

  await sharp(req.files.photo[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.photo}`);

  next();
});

exports.resizeUserImageCover = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover) return next();

  req.body.imageCover = `user-${req.user.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(820, 312)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.imageCover}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    'name',
    'phone',
    'about',
    'photo',
    'imageCover'
  );

  if (!req.body) {
    return next(AppError('Please update your details', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const plugReviews = await PlugReview.find({ user: req.user.id });

  if (plugReviews) {
    await PlugReview.deleteMany({ user: req.user.id });
  }

  const Reviews = await Review.find({ user: req.user.id });

  if (Reviews) {
    await Review.deleteMany({ user: req.user.id });
  }

  await User.findByIdAndDelete(req.user.id);

  const url = `${req.protocol}://${req.get('host')}`;
  await new Email(req.user, url).sendFarewellToUser();

  res.status(204).json({
    status: 'success'
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! All users must register their accounts'
  });
};

exports.getUser = factory.getOne(User, { path: 'following' });
exports.getAllUsers = factory.getAll(User);

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
