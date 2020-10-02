const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(reviewController.setProductUserIds, reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    reviewController.validProductValidator,
    reviewController.ReviewValidator,

    reviewController.updateReview
  )
  .delete(
    authController.protect,
    reviewController.validProductValidator,
    reviewController.ReviewValidator,
    reviewController.deleteReview
  );

module.exports = router;
