const catchAsync = require('./../utils/catchAsync');
const Email = require('../utils/email');
const AppError = require('./../utils/appError');

exports.sendInquiry = catchAsync(async (req, res, next) => {
  if (!req.body.name && req.body.email && req.body.email)
    return next(new AppError('Please enter the required fields', 400));

  const inquiry = {
    username: req.body.name,
    userEmail: req.body.email,
    inquiryMessage: req.body.message
  };
  const admin = {
    email: process.env.CUSTOMER_SERVICE_EMAIL,
    name: process.env.CUSTOMER_SERVICE_NAME
  };
  await new Email(admin, undefined, inquiry).sendToAdminUserInquiry();

  res.status(200).json({
    status: 'success',
    message: 'Inquiry sent'
  });
});
