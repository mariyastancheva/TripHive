const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review:{
        type: String,
        min: [20, 'The review should be at least 20 chars'],
        required: [true, 'The review is required']
    },
    rating:{
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour:{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'The review must belong to a tour.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'The review must belong to a user.']
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Create this index in order to imply uniqueness for review per tour per user
reviewSchema.index({tour: 1, user: 1}, {unique: true});

reviewSchema.pre(/^find/, function(next){
    this.populate({
        path:'user',
        select: 'name photo'
    });
    next();
})

reviewSchema.statics.calcAverageRatings = async function(tourId){
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: 
            {
                _id: '$tour',
                nRating: {$sum:1},
                avgRating: {$avg: '$rating'}
            },
        }
    ]);
    // GET the tour object and update the ratingsQuantity and ratingsAverage based on the new review that is added
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
    })
    
}

reviewSchema.post('save', function(){
    this.constructor.calcAverageRatings(this.tour);
})

reviewSchema.post(/^findOneAnd/, async function(doc) {
    if (doc) {
      await doc.constructor.calcAverageRating(doc.tour);
    }
});

const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;