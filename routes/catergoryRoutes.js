const express = require('express');
const catergoryController = require('../controllers/catergoryController');
const authController = require('./../controllers/authController');
const subcatergoryRouter = require('./subCatergoryRoutes');

const router = express.Router();

router.use(authController.protect);

router.use('/:catergoryId/subcatergories', subcatergoryRouter);
router
  .route('/')
  .post(
    authController.restrictTo('admin'),
    authController.protect,
    catergoryController.createCatergory
  )
  .get(catergoryController.getAllCatergories);

router
  .route('/:id')
  .get(catergoryController.getCatergory)
  .patch(
    authController.restrictTo('admin'),
    authController.protect,
    catergoryController.updateCatergory
  )
  .delete(
    authController.restrictTo('admin'),
    authController.protect,
    catergoryController.deleteCatergory
  );

module.exports = router;
