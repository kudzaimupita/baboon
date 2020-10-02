const express = require('express');
const authController = require('./../controllers/authController');
const refundController = require('./../controllers/refundController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route('/')

  .post(
    refundController.uploadProductImages,
    refundController.resizeProductImagesArray,
    refundController.createRefund
  );

router.get('/myrefunds', refundController.getMyRefunds);

router.use(authController.restrictTo('admin'));

router.route('/:refundId').get(refundController.userRefund);
router.route('/').get(refundController.getAllRefunds);
router.route('/:refundId').patch(refundController.resolveUserRefund);

module.exports = router;
