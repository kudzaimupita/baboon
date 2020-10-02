const express = require('express');
const plugController = require('../controllers/plugController');
const authController = require('./../controllers/authController');
const productsRouter = require('./productRoutes');
const plugReviewRouter = require('./plugReviewRoutes');
const orderRouter = require('./../routes/orderRoutes');

const router = express.Router();

router.use('/:plugId/products', productsRouter);
router.use('/:plugId/orders', orderRouter);
router.use('/:plugId/plugreviews', plugReviewRouter);

router.route('/myplug').get(authController.protect, plugController.getMyPlug);
router
  .route('/')
  .post(
    authController.protect,
    plugController.plugValidator,
    plugController.uploadPlugImages,
    plugController.resizeImageLogo,
    plugController.resizePlugImageCover,
    plugController.createPlug
  )
  .get(plugController.getAllPlugs);

router
  .route('/:id')
  .get(plugController.getPlug)
  .patch(
    authController.protect,
    plugController.uploadPlugImages,
    plugController.resizeImageLogo,
    plugController.resizePlugImageCover,
    plugController.updatePlug
  )
  .delete(authController.protect, plugController.deactivatePlug);

router.route('/follow/:id').put(authController.protect, plugController.follow);

router
  .route('/unfollow/:id')
  .put(authController.protect, plugController.unFollow);

router.use(authController.protect, authController.restrictTo('admin'));

router.route('/admin/:id').delete(plugController.deletePlug);
router.route('/admin/approveplug/:id').patch(plugController.approvePlug);

module.exports = router;
