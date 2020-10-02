const mongoose = require('mongoose');

const catergorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please add a catergory name!'],
      unique: true
    },
    createdOn: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

catergorySchema.virtual('subcatergories', {
  ref: 'SubCatergory',
  foreignField: 'catergory',
  localField: '_id'
});

const Catergory = mongoose.model('Catergory', catergorySchema);

module.exports = Catergory;
