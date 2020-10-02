const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const catchAsync = require('../utils/catchAsync');
const Order = require('../models/orderModel');
const factory = require('./handlerFactory');
const Plug = require('../models/plugModel');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Product = require('../models/productModel');

exports.checkoutSession = catchAsync(async (req, res, next) => {
  const generateRefId = `${req.user.id}-${Date.now()}`;

  const products = req.body.products.map(product => ({
    name: product.Name,
    amount: Math.round(product.Price) * 10 * 10,
    description: product.description,
    quantity: product.quantity,
    currency: 'zar'
  }));
  const filteredProducts = req.body.products.filter(
    // eslint-disable-next-line eqeqeq
    product => product._id != undefined
  );

  const productIds = filteredProducts
    .map(product => product._id.repeat(product.quantity || 1).match(/(.{24})/g))
    .toString()
    .split(',');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/api/v1/myorders`,
    cancel_url: `${req.protocol}://${req.get('host')}/api/v1/products`,
    customer_email: req.user.email,
    client_reference_id: generateRefId,
    line_items: products,
    shipping_address_collection: req.body.address
  });

  await Order.create({
    refId: generateRefId,
    user: req.user.id,
    createdOn: new Date(Date.now()),
    status: 'atWarehouse',
    shippingAddress: req.body.shippingAddress,
    phone: req.body.phone,
    expectedOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    comments: req.body.comments,
    products: productIds,
    paymentStatus: 'pending',
    plugsBalanced: false,
    refund: false
  });

  res.status(200).json({
    status: 'success',
    session
  });
});

const createBookingCheckout = async session => {
  const body = {
    paymentStatus: 'confirmed',
    totalPrice: session.amount_total / 100
  };

  await Order.findOneAndUpdate({ refId: session.client_reference_id }, body);
  // const productIds = order.products.map(product => product._id);
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      'whsec_AhseuzGw5mL7ve4oO5uAVaUYlngVZ84p'
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({
    user: req.user.id,
    paymentStatus: 'confirmed'
  });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: orders
  });
});

exports.plugSales = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.plugId);

  // eslint-disable-next-line eqeqeq
  if (plug.plugAdmin._id != req.user.id) {
    return next(new AppError(`Not authorized to perform this action!`, 404));
  }
  const orders = await Order.aggregate([
    {
      $match: { paymentStatus: 'confirmed' }
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $project: {
        orderId: 0,
        products: 0,
        paymentMethod: 0,
        comments: 0,
        __v: 0,
        totalPrice: 0,
        fragile: 0
      }
    },

    {
      $sort: { createdOn: -1 }
    }
  ]);

  const filteredResults = orders.filter(order => order.product.length > 0);

  const plugSales = filteredResults.filter(
    // eslint-disable-next-line eqeqeq
    order => order.product[0].plug == req.params.plugId
  );
  const pricesArray = plugSales.map(sale => sale.product[0].price);

  // Getting sum of numbers
  const sum = pricesArray.reduce(function(a, b) {
    return a + b;
  }, 0);

  const amount = sum - sum * process.env.COMMISSION_CONSTANT;

  const totalRevenue = Math.round(amount);

  res.status(200).json({
    status: 'success',
    results: plugSales.length,
    data: { totalRevenue, plugSales }
  });
});

exports.salesDue = catchAsync(async (req, res, next) => {
  const plug = await Plug.findById(req.params.plugId);

  // eslint-disable-next-line eqeqeq
  if (plug.plugAdmin._id != req.user.id) {
    return next(new AppError(`Not authorized to perform this action!`, 404));
  }
  const orders = await Order.aggregate([
    {
      $match: { paymentStatus: 'confirmed' }
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $project: {
        orderId: 0,
        products: 0,
        paymentMethod: 0,
        comments: 0,
        __v: 0,
        totalPrice: 0,
        fragile: 0
      }
    },

    {
      $sort: { createdOn: -1 }
    },
    {
      $match: { plugsBalanced: false }
    }
  ]);

  const filteredResults = orders.filter(order => order.product.length > 0);

  const plugSales = filteredResults.filter(
    // eslint-disable-next-line eqeqeq
    order => order.product[0].plug == req.params.plugId
  );
  const pricesArray = plugSales.map(sale => sale.product[0].price);

  // Getting sum of numbers
  const sum = pricesArray.reduce(function(a, b) {
    return a + b;
  }, 0);

  const amount = sum - sum * process.env.COMMISSION_CONSTANT;

  const amountDue = Math.round(amount);

  res.status(200).json({
    status: 'success',
    results: plugSales.length,
    data: { amountDue, plugSales }
  });
});
//admin
exports.orderDetails = catchAsync(async (req, res, next) => {
  const orders = await Order.aggregate([
    {
      $match: { paymentStatus: 'confirmed' }
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      $lookup: {
        from: 'plugs',
        localField: 'product.plug',
        foreignField: '_id',
        as: 'plugDetails'
      }
    },
    {
      $project: {
        orderId: 0,
        paymentMethod: 0,
        __v: 0,
        fragile: 0,
        user: 0,
        products: 0
      }
    }
  ]);

  const filteredResults = orders.filter(order => order.product.length > 0);

  const order = filteredResults.filter(
    // eslint-disable-next-line eqeqeq
    orderr => orderr._id == req.params.orderId
  );

  res.status(200).json({
    status: 'success',
    results: order.length,
    data: { order }
  });
});

//admin revenue

exports.stats = catchAsync(async (req, res, next) => {
  const orders = await Order.aggregate([
    {
      $match: { paymentStatus: 'confirmed' }
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'products',
        localField: 'products',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $project: {
        orderId: 0,
        paymentMethod: 0,
        __v: 0,
        fragile: 0,
        user: 0,
        products: 0
      }
    }
  ]);

  const filteredResults = orders.filter(order => order.product.length > 0);
  const ordersPaidFor = filteredResults.filter(
    // eslint-disable-next-line eqeqeq
    result => result.plugsBalanced == true
  );
  const totalResults = ordersPaidFor.map(order => order.product[0].price);

  const amountPaidToPlugs = totalResults.reduce(function(a, b) {
    return a + b;
  }, 0);
  const totalPaidToPlugs =
    amountPaidToPlugs - amountPaidToPlugs * process.env.COMMISSION_CONSTANT;

  const pricesArray = filteredResults.map(sale => sale.product[0].price);

  // Getting sum of numbers
  const sum = pricesArray.reduce(function(a, b) {
    return a + b;
  }, 0);

  const activeUsers = await User.find();
  const totalPlugs = await Plug.find({ approved: true });
  const totalProducts = await Product.find();

  const amount = sum - sum * process.env.COMMISSION_CONSTANT;
  const revenueBeforeCommission = Math.round(sum);
  const revenueAfterCommission = Math.round(amount);
  const totalOrders = await Order.find();
  const revenueAmount = revenueBeforeCommission - revenueAfterCommission;

  res.status(200).json({
    status: 'success',
    data: {
      productsSold: filteredResults.length,
      totalOrders: totalOrders.length,
      grossRevenue: revenueBeforeCommission,
      netRevenue: revenueAmount,
      currentAmountPaidToPlugs: totalPaidToPlugs,
      activeUsers: activeUsers.length,
      totalPlugs: totalPlugs.length,
      totalProducts: totalProducts.length
    }
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateOrder = catchAsync(async (req, res, next) => {
  if (req.user) req.body.orderUpdatedBy = req.user.id;
  if (req.user) req.body.orderUpdatedOn = Date.now();

  const filteredBody = filterObj(
    req.body,
    'status',
    'refund',
    'plugsBalanced',
    'fragile',
    'orderUpdatedBy',
    'orderUpdatedOn',
    'deliveredOn'
  );

  if (!req.body) {
    return next(AppError('Please enter details', 400));
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.orderId,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  ).select('-products');

  res.status(200).json({
    status: 'success',
    data: {
      order: updatedOrder
    }
  });
});

exports.getAllOrders = factory.getAll(Order);
exports.getOrderById = factory.getOne(Order);

exports.deleteOrder = factory.deleteOne(Order);

// exports.plugSales = catchAsync(async (req, res, next) => {
//   const orders = await Order.aggregate([
//     {
//       $unwind: '$products'
//     },
//     {
//       $sort: { createdOn: 1 }
//     }
//   ]);

//   const products = orders.filter(product => product.products !== null);

//   const productIds = products.map(product => product.products);

//   const foundProducts = productIds.map(product => Product.findById(product));
//   const results = await Promise.all(foundProducts);
//   const filteredResults = results.filter(result => result !== null);

//   const sales = filteredResults.filter(
//     result => result.plug.id === req.params.plugId
//   );

//   res.status(200).json({
//     status: 'success',
//     results: sales.length,
//     data: sales
//   });
// });
