const express = require('express');
const plugReviewController = require('../controllers/plugReviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    plugReviewController.validPlugValidator,
    plugReviewController.getAllPlugReviews
  )
  .post(
    authController.protect,
    plugReviewController.validPlugValidator,
    plugReviewController.setPlugUserIds,
    plugReviewController.createPlugReview
  );

router
  .route('/:id')
  .get(
    plugReviewController.validPlugValidator,
    plugReviewController.getPlugReview
  )
  .patch(
    authController.protect,
    plugReviewController.plugReviewValidator,
    plugReviewController.updatePlugReview
  )
  .delete(
    authController.protect,
    plugReviewController.validPlugValidator,
    plugReviewController.plugReviewValidator,
    plugReviewController.deletePlugReview
  );

module.exports = router;
