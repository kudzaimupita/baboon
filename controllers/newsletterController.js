const factory = require('./handlerFactory');
const Newsletter = require('../models/newsletterModel');

exports.getListOfSubscribers = factory.getAll(Newsletter);
exports.joinList = factory.createOne(Newsletter);
// exports.unSubscribe = factory.deleteOne(MailingList);
