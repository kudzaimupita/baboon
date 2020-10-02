const express = require('express');
const passport = require('passport');

const router = express.Router();
const jwt = require('jsonwebtoken');
const Email = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

router.get(
  '/google/callback',
  passport.authenticate('google'),
  catchAsync(async (req, res) => {
    const token = signToken(req.user._id);

    const refDate = req.user.createdOn.getTime();
    const refTime = Date.now() - refDate;

    if (refTime < 1000) {
      const url = `${req.protocol}://${req.get('host')}/me`;
      await new Email(req.user, url).sendWelcome();
    }

    res.status(200).json({
      status: 'success',
      token
    });
  })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook'),
  catchAsync(async (req, res) => {
    const token = signToken(req.user._id);

    const refDate = req.user.createdOn.getTime();
    const refTime = Date.now() - refDate;

    if (refTime < 1000) {
      const url = `${req.protocol}://${req.get('host')}/me`;
      await new Email(req.user, url).sendWelcome();
    }

    res.status(200).json({
      status: 'success',
      token
    });
  })
);

module.exports = router;
