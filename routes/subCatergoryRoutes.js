const express = require('express');
const subCatergoryController = require('../controllers/subCatergoryController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    subCatergoryController.createSubCatergory
  )
  .get(subCatergoryController.getAllSubCatergories);

router
  .route('/:id')
  .get(subCatergoryController.getSubCatergory)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    subCatergoryController.updateSubCatergory
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    subCatergoryController.deleteSubCatergory
  );

module.exports = router;
