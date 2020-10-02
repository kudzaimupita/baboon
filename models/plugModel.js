const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const plugSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A plug must have a name'],
      trim: true,
      unique: [true, 'Please provide a unique name for your plug'],
      maxlength: [40, 'Please enter a name less than 40 characters']
    },
    displayName: {
      type: String,
      maxlength: [40, 'Please enter a name less than 40 characters']
    },
    companyEmail: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid company email']
    },
    shippingAddress: {
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },
    aboutUs: {
      type: String,
      required: [
        true,
        'Your customers will need a little information about you'
      ]
    },
    plan: {
      type: String,
      enum: ['essential', 'enterprise'],
      default: 'essential'
    },
    bankAccountDetails: {
      accountHolderName: String,
      accountHolderSurname: String,
      accountNumber: String,
      accountBranchCode: String,
      bankName: String
    },
    phone: {
      type: String,
      maxlength: [20, 'Please enter a valid phone number'],
      minlength: [5, 'Please enter a valid phone number']
    },
    createdOn: {
      type: Date,
      default: Date.now()
    },
    active: {
      type: Boolean,
      default: true
    },
    approved: {
      type: Boolean,
      default: false
    },
    imageCover: {
      type: String,
      default: 'default.jpg'
    },
    logo: {
      type: String,
      default: 'default.jpg'
    },
    followers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    instagramLink: String,
    facebookLink: String,
    twitterLink: String,
    plugAdmin: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A plug must belong to a user']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    catergory: {
      type: mongoose.Schema.ObjectId,
      ref: 'Catergory',
      required: [true, 'A plug must belong to a catergory']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    tags: [String],
    slug: String
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

plugSchema.index({
  name: 'text',
  aboutUs: 'text',
  tags: 'text'
});

plugSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'plugAdmin',
    select: 'name photo '
  });
  next();
});

plugSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'followers',
    select: 'name photo'
  });
  next();
});

plugSchema.virtual('products', {
  ref: 'Product',
  foreignField: 'plug',
  localField: '_id'
});

plugSchema.virtual('reviews', {
  ref: 'PlugReview',
  foreignField: 'plug',
  localField: '_id'
});

plugSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

plugSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// plugSchema.pre(/^find/, function(next) {
//   this.find({ approved: { $ne: false } });
//   next();
// });

plugSchema.index({ plugAdmin: 1 }, { unique: true });

const Plug = mongoose.model('Plug', plugSchema);

module.exports = Plug;
