const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String
    },
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
      }
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An order must belong to a User!']
    },
    totalPrice: {
      type: Number,
      require: [true, 'An order must have a price!']
    },
    createdOn: {
      type: Date,
      default: Date.now()
    },
    status: {
      type: String,
      enum: ['enroute', 'fullfilled', 'atWarehouse', 'cancelled', 'returned'],
      default: 'atWarehouse'
    },
    dispatchedOn: {
      type: Date
    },
    fullfieldOn: {
      type: Date
    },
    comments: {
      type: String
    },
    phone: {
      type: String,
      required: [true, 'We need your contact number!']
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    expectedOn: {
      type: Date
    },
    plugsBalanced: {
      type: Boolean,
      default: false
    },
    refund: {
      type: Boolean,
      default: false
    },
    courierDetails: {
      type: String
    },
    paymentMethod: {
      type: String,
      default: 'card',
      enum: ['cash', 'card']
    },
    trackingNumber: {
      type: String
    },
    fragile: {
      type: Boolean,
      default: false
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'confirmed']
    },
    orderUpdatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    orderUpdatedOn: Date,
    deliveredOn: {
      type: Date
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo email'
  });
  next();
});

orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'products',
    select: 'name price description'
  });
  next();
});

orderSchema.pre(/^aggregate/, function(next) {
  this.populate({
    path: 'products',
    select: 'name price description plug'
  });
  next();
});

orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'orderUpdatedBy',
    select: 'name email '
  });
  next();
});

orderSchema.pre('find', function(next) {
  this.find({ paymentStatus: 'confirmed' });
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
