const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true,
      maxlength: [
        30,
        'A product name must have less or equal then 30 characters'
      ],
      minlength: [2, 'A product name must have more or equal then 2 characters']
    },
    price: {
      type: Number,
      validate: {
        validator: Number,
        message: '{VALUE} is not an integer value'
      },
      required: [true, 'A product must have a price!']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        'A product desciption must have less or equal then 1000 characters'
      ],
      minlength: [
        50,
        'A product description must have more or equal then 50 characters'
      ]
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    size: {
      type: String
    },
    color: {
      type: String
    },
    subCatergory: {
      type: mongoose.Schema.ObjectId,
      ref: 'SubCatergory'
    },
    brandName: {
      type: String,
      required: [true, 'Each product should have a brand name']
    },
    imageCover: {
      type: String,
      required: [true, 'Each product should have a cover image']
    },
    images: [String],
    tags: [String],
    createdOn: {
      type: Date,
      default: Date.now()
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
    internationalDelivery: {
      type: Boolean,
      default: true
    },
    quantityInStock: {
      type: Number
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'boys', 'girls', 'unisex']
    },
    plug: {
      type: mongoose.Schema.ObjectId,
      ref: 'Plug',
      required: [true, 'A product should have a plug']
    },
    was: {
      type: Number
    },
    pricedToGo: {
      type: Boolean,
      default: false
    },

    outOfStock: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({
  name: 'text',
  brandName: 'text',
  description: 'text',
  tags: 'text',
  specsAndDetails: 'text'
});

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

productSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'plug',
    select: 'name logo plugAdmin -followers approved'
  });
  next();
});

productSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'subCatergory',
    select: 'name '
  });
  next();
});

// productSchema.pre(/^find/, function(next) {
//   console.log(this.find({ brandName: 'Prada' }));
//   next();
// });
productSchema.pre(/^find/, function(next) {
  this.find({ outOfStock: { $ne: true } });

  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
