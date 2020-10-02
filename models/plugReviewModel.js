const mongoose = require('mongoose');
const Plug = require('./plugModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdOn: {
      type: Date,
      default: Date.now
    },
    plug: {
      type: mongoose.Schema.ObjectId,
      ref: 'Plug',
      required: [true, 'A review must belong to a plug.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ plug: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(plugId) {
  const stats = await this.aggregate([
    {
      $match: { plug: plugId }
    },
    {
      $group: {
        _id: '$plug',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Plug.findByIdAndUpdate(plugId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Plug.findByIdAndUpdate(plugId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.plug);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function(next) {
  await this.r.constructor.calcAverageRatings(this.r.plug);
});

const PlugReview = mongoose.model('PlugReview', reviewSchema);

module.exports = PlugReview;
