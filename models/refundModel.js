const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      required: [true, 'A reason can not be empty!']
    },
    status: {
      type: String,
      enum: ['awaitingResponse', 'approved', 'rejected'],
      default: 'awaitingResponse'
    },
    reasonForRejection: {
      type: String
    },
    bankAccountDetails: {
      accountHolderName: String,
      accountHolderSurname: String,
      accountNumber: String,
      accountBranchCode: String,
      bankName: String
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'A refund should have a product.']
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order',
      required: [true, 'A refund should belong to an order.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A refund should have a user']
    },
    images: [{ type: String }],
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedOn: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    createdOn: {
      type: Date,
      default: Date.now()
    },
    amountRefunded: {
      type: Number
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

refundSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'resolvedBy',
    select: 'name photo'
  });
  next();
});

const Refund = mongoose.model('Refund', refundSchema);

module.exports = Refund;
