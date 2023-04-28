const Review = require('../models/reviewModel');
const catchAsyncError = require('../utils/catchAsyncError');
const handlersFactory = require('./handlersFactory');

exports.setTourUserIds = catchAsyncError(async(req, res, next) => {
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
});


exports.getReviews = handlersFactory.getAll(Review);
exports.getReview = handlersFactory.getOne(Review);
exports.deleteReview = handlersFactory.deleteOne(Review);
exports.updateReview = handlersFactory.updateOne(Review);
exports.createReview = handlersFactory.createOne(Review);