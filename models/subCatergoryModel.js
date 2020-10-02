const mongoose = require('mongoose');

const subCatergorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please add a sub-catergory title'],
      unique: true
    },
    catergory: {
      type: mongoose.Schema.ObjectId,
      ref: 'Catergory',
      // select: true
      required: [true, 'A subCatergory should belong to a catergory']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

subCatergorySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'catergory',
    select: 'name '
  });
  next();
});

subCatergorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'subCatergory',
  localField: '_id'
});

const SubCatergory = mongoose.model('SubCatergory', subCatergorySchema);

module.exports = SubCatergory;
