const express = require('express');
const userInquiryController = require('../controllers/userInquiryController');

const router = express.Router();

router.route('/').post(userInquiryController.sendInquiry);

module.exports = router;
