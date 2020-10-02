const SubCatergory = require('../models/subCatergoryModel');
const factory = require('./handlerFactory');

exports.getAllSubCatergories = factory.getAll(SubCatergory);
exports.getSubCatergory = factory.getOne(SubCatergory);
exports.createSubCatergory = factory.createOne(SubCatergory);
exports.updateSubCatergory = factory.updateOne(SubCatergory);
exports.deleteSubCatergory = factory.deleteOne(SubCatergory);
