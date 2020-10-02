const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.post(
  '/create-session',
  authController.protect,
  orderController.checkoutSession
);

router.get('/myorders', authController.protect, orderController.getMyOrders);
router.get('/', authController.protect, orderController.plugSales);
router.get('/salesDue', authController.protect, orderController.salesDue);

router.use(authController.protect, authController.restrictTo('admin'));

router.get('/stats', orderController.stats);
router.get('/admin', orderController.getAllOrders);
router.get('/:orderId', orderController.orderDetails);
router.patch('/:orderId', orderController.updateOrder);

module.exports = router;
