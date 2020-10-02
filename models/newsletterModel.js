const mongoose = require('mongoose');
const validator = require('validator');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email!']
  },
  catergory: {
    type: mongoose.Schema.ObjectId,
    ref: 'Catergory',
    required: [true, 'Please provide a catergory!']
  },
  createdOn: {
    type: Date,
    default: Date.now()
  }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
