const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const cookieSession = require('cookie-session');

// eslint-disable-next-line no-unused-vars
const passportConfig = require('./config/passportConfig');
const globalErrorHandler = require('./controllers/errorController');

const productRouter = require('./routes/productRoutes');
const subCatergoryRouter = require('./routes/subCatergoryRoutes');
const catergoryRouter = require('./routes/catergoryRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const plugRouter = require('./routes/plugRoutes');
const newsletterRouter = require('./routes/newsletterRoutes');
const oauthCallbackRouter = require('./routes/OautCallbackRoutes.js');
const plugReviewRouter = require('./routes/plugReviewRoutes');
const orderController = require('./controllers/orderController');
const orderRouter = require('./routes/orderRoutes');
const userInquiryRouter = require('./routes/userInquiryRoutes');
const refundRouter = require('./routes/refundRoutes');

const app = express();

app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: process.env.SESSION_KEY
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.options('*', cors());

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  orderController.webhookCheckout
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cookieParser());
app.use(mongoSanitize());

app.use(xss());
app.use(hpp());

app.use(compression());

app.use('/auth', oauthCallbackRouter);
app.use('/api/v1/catergories', catergoryRouter);
app.use('/api/v1/subcatergories', subCatergoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/plugs', plugRouter);
app.use('/api/v1/newsletter', newsletterRouter);
app.use('/api/v1/inquiries', userInquiryRouter);
app.use('/api/v1/plugreviews', plugReviewRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/refunds', refundRouter);

app.use(globalErrorHandler);

module.exports = app;
