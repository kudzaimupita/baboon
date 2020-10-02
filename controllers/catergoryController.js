const Catergory = require('../models/catergoryModel');
const factory = require('./handlerFactory');

exports.getAllCatergories = factory.getAll(Catergory);
exports.getCatergory = factory.getOne(Catergory, { path: 'subcatergories' });
exports.createCatergory = factory.createOne(Catergory);
exports.updateCatergory = factory.updateOne(Catergory);
exports.deleteCatergory = factory.deleteOne(Catergory);
