const express = require('express');
const newsletterController = require('../controllers/newsletterController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(newsletterController.joinList)
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    newsletterController.getListOfSubscribers
  );

module.exports = router;
