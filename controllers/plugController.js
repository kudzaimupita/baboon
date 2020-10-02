const sharp = require('sharp');
const multer = require('multer');
const mongoose = require('mongoose');

const Plug = require('../models/plugModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Product = require('../models/productModel');
const Email = require('../utils/email');
const AdminEmail = require('../utils/adminEmailHandler');
const PlugReview = require('../models/plugReviewModel');

const { ObjectId } = mongoose.Types.ObjectId;

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload images only!.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadPlugImages = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'imageCover', maxCount: 1 }
]);

exports.resizeImageLogo = catchAsync(async (req, res, next) => {
  if (!req.files.logo) return next();

  req.body.logo = `plug-${req.user.id}-${Date.now()}-logo.jpeg`;

  await sharp(req.files.logo[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/plugs/${req.body.logo}`);

  next();
});

exports.resizePlugImageCover = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover) return next();

  req.body.imageCover = `plug-${req.user.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(820, 312)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/plugs/${req.body.imageCover}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updatePlug = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'name',
    'companyEmail',
    'address',
    'logo',
    'aboutUs',
    'phone',
    'imageCover',
    'instagramLink',
    'facebookLink',
    'twitterLink',
    'catergory',
    'tags',
    'bankAccountDetails',
    'displayName'
  );

  let plug = await Plug.findById(req.params.id);

  if (!plug) {
    return next(new AppError(`That plug doesnt exist !`, 404));
  }

  // Make sure user is bootcamp owner
  if (plug.plugAdmin._id.toString() !== req.user.id) {
    return next(new AppError(`Not authorized to perform this action!!`, 401));
  }

  plug = await Plug.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(201).json({
    status: 'success',
    data: plug
  });
});

exports.deactivatePlug = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.id);

  if (!plug) {
    return next(new AppError(`That plug doesnt exist!`, 404));
  }

  if (plug.plugAdmin._id.toString() !== req.user.id) {
    return next(new AppError(`Not authorized to perform this action!`, 401));
  }
  const plugProducts = await Product.find({ plug: req.params.id });

  if (plugProducts) {
    await Product.deleteMany({ plug: req.params.id });
  }

  const plugReviews = await PlugReview.find({ plug: req.params.id });
  if (plugReviews) {
    await PlugReview.deleteMany({ plug: req.params.id });
  }

  await Plug.findByIdAndDelete(req.params.id);
  // , { active: false }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.deletePlug = catchAsync(async (req, res, next) => {
  const plugProducts = await Product.find({ plug: req.parmas.id });

  if (plugProducts) {
    await Product.deleteMany({ plug: req.params.id });
  }

  const plugReviews = await PlugReview.find({ plug: req.params.id });
  if (plugReviews) {
    await PlugReview.deleteMany({ plug: req.params.id });
  }

  const plug = await Plug.findById(req.params.id);

  if (!plug) {
    return next(new AppError(`Oops, plug doesnt exist!`, 404));
  }

  await plug.remove();

  res.status(200).json({
    status: 'success',
    data: {}
  });
});

exports.plugValidator = catchAsync(async (req, res, next) => {
  const plug = await Plug.findOne({ plugAdmin: req.user.id });

  if (plug) {
    return next(new AppError(`A user can only have one plug!`, 404));
  }

  next();
});

exports.approvePlug = catchAsync(async (req, res, next) => {
  const approvedPlug = await Plug.findByIdAndUpdate(req.params.id, {
    approved: true,
    new: true
  });

  const user = await User.findById(approvedPlug.plugAdmin._id);

  const url = `${req.protocol}://${req.get('host')}/myplug`;
  await new Email(user, url, '', approvedPlug).sendWelcomeToPlug();

  res.status(200).json({
    status: 'success',
    data: approvedPlug
  });
});

exports.getMyPlug = catchAsync(async (req, res, next) => {
  const plug = await Plug.findOne({
    plugAdmin: { _id: ObjectId(req.user.id) }
    // plugAdmin.id: req.user.id
  }).populate({ path: 'products reviews' });

  res.status(200).json({
    status: 'success',
    data: { plug }
  });
});

exports.follow = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.id);

  if (plug.followers.some(follower => follower.id.toString() === req.user.id)) {
    return next(new AppError(`Already following this plug!`, 404));
  }

  plug.followers.unshift(req.user.id);

  await plug.save();

  res.status(200).json({
    status: 'success',
    message: 'Followed!'
  });
});

exports.unFollow = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.id);

  if (
    !plug.followers.some(follower => follower.id.toString() === req.user.id)
  ) {
    return next(new AppError(`You're already not following this plug!`, 404));
  }

  plug.followers = plug.followers.filter(
    follower => follower.id.toString() !== req.user.id
  );

  await plug.save();

  res.status(200).json({
    status: 'success',
    message: 'Unfollowed!'
  });
});

exports.plugTransactionDelete = catchAsync(async (req, res, next) => {
  const plug = await Plug.findOne({ plugAdmin: req.user.id });

  if (plug) req.body.plugId = plug._id;
  if (plug) await Plug.deleteOne({ plugAdmin: req.user.id });

  next();
});

exports.createPlug = catchAsync(async (req, res, next) => {
  const newPlug = await Plug.create({
    name: req.body.name,
    companyEmail: req.body.companyEmail,
    address: req.body.address,
    aboutUs: req.body.aboutUs,
    bankAccountDetails: req.body.bankAccountDetails,
    catergory: req.body.catergory,
    phone: req.body.phone,
    imageCover: req.body.imageCover,
    logo: req.body.logo,
    instagramLink: req.body.instagramLink,
    facebookLink: req.body.facebookLink,
    twitterLink: req.body.twitterLink,
    tags: req.body.tags,
    plugAdmin: req.user.id,
    displayName: req.body.displayName
  });
  const admin = {
    email: process.env.CUSTOMER_SERVICE_EMAIL,
    name: process.env.CUSTOMER_SERVICE_NAME
  };
  const url = `${req.protocol}://${req.get('host')}/api/v1/plugs/${
    newPlug._id
  }`;

  const body = { admin, newPlug, url };

  await new AdminEmail(admin, body).sendAdminPlugApplication();

  res.status(200).json({
    status: 'success',
    data: newPlug
  });
});

exports.getAllPlugs = factory.getAll(Plug);
exports.getPlug = factory.getOne(Plug, { path: 'products reviews' });
