const catchAsyncError = require('../utils/catchAsyncError');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures.js');

exports.deleteOne = Model => catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc) return next(new AppError('No document found with that ID', 404));

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.updateOne = Model => catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

    if(!doc){
        return next(new AppError('Such document does not exist.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: doc
    });
});

exports.createOne = Model => catchAsyncError(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: doc
    })
});

exports.getOne = (Model, populate) => catchAsyncError(async (req, res, next) => {
    let query =  Model.findById(req.params.id)
    if(populate) query.populate(populate);
    const doc = await query;

    if(!doc) return next(new AppError('No doc found with that ID', 404));

    res.status(200).json({
        status: 'success',
        data: doc
    });
});

exports.getAll = Model => catchAsyncError(async(req, res) => {
    // This filter is ment for the reviews;
    let filter = {};
    if(req.params.tourId) filter = {tour: req.params.tourId};

    const features = new APIFeatures(Model.find(), req.query).filter().sort().paginate().fields();
    const doc = await features.query;

    res.status(200).json({
        status: 'success',
        results: doc.length,
        data:doc
    })
});