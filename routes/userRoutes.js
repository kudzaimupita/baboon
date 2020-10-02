const express = require('express');
const passport = require('passport');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const plugController = require('../controllers/plugController');
const productController = require('../controllers/productController');

const router = express.Router();

//Oauth Routing
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserImages,
  userController.resizeUserPhoto,
  userController.resizeUserImageCover,
  userController.updateMe
);
router.delete(
  '/deleteMe',
  plugController.plugTransactionDelete,
  productController.productsTransactionDelete,
  userController.deleteMe
);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
