const express = require('express');
const productController = require('../controllers/productController');
const authController = require('./../controllers/authController');

const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router({ mergeParams: true });

router.use('/:productId/reviews', reviewRouter);

router.route('/stats').get(productController.productStats);

router.get('/search', productController.searchProducts);
router.get('/randomproducts/:id', productController.randomProductsByCatergory);

router.get(
  '/randomproductsbybrand/:brand',
  productController.randomProductsByBrandname
);

router.get('/feed', authController.protect, productController.userFeedProducts);

router
  .route('/')
  .post(
    authController.protect,
    productController.isPlugAdminValidator,
    productController.onlyApprovedPlugsPostProducts,
    productController.uploadProductImages,
    productController.resizeProductImagesArray,
    productController.resizeProductImages,
    productController.createProduct
  )
  .get(productController.getAllProducts);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    productController.isPlugAdminValidator,
    productController.uploadProductImages,
    productController.resizeProductImagesArray,
    productController.resizeProductImages,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    productController.isPlugAdminValidator,
    productController.deleteProduct
  );

module.exports = router;
