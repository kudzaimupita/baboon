const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const passport = require('passport');

const User = require('../models/userModel');
const AppError = require('../utils/appError');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      const newUser = {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        coverImage: 'default.jpeg',
        photo: profile.photos[0].value,
        role: 'user',
        active: true,
        createdOn: new Date(Date.now()),
        localUser: false
      };

      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          done(null, user);
        } else {
          user = await User.collection.insertOne(newUser);

          done(null, user.ops[0]);
        }
      } catch (err) {
        return new AppError(
          'Oops, there was a problem. Please try another signin method',
          400
        );
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      const newUser = {
        facebookId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        photo: profile.photos[0].value,
        role: 'user',
        active: true,
        createdOn: new Date(Date.now()),
        localUser: false
      };

      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          done(null, user);
        } else {
          user = await User.collection.insertOne(newUser);

          done(null, user.ops[0]);
        }
      } catch (err) {
        return new AppError(
          'Oops, there was a problem. Please try another signin method',
          400
        );
      }
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
