const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a unique name.'],
        unique: true,
        trim: true,
        maxLength: [40, 'The tour must have max 40 characters.'],
        minLength: [10, 'The tour must have at least 10 characters.']
    },
    secretTour: {
        type: Boolean,
        default: false
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration.']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size.']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty.'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium or difficult'
        }
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
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(value){
                // This is only when creating a new doc NOT FOR UPDATING 
                return value < this.price;
            },
            message: 'The priceDiscount should be less than the actual price.'
        }
    },
    summary: {
        type: String,
        trim: true,
        required:[true, 'Atour must have a summary description']
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image.']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    startLocation:{
        type:{
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates:{
            type: [Number],
            default: [0, 0]
        },
        address: String,
        description: String
    },
    slug: {
        type:String,
        required: true
    },
    locations:[
        {
            type:{
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates:[Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides:[
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
    
}, {
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('dirationWeeks').get(function(){
    return this.duration / 7;
});

// tourSchema.virtual('slug').get(function() {
//     return slugify(this.name, { lower: true });
// });

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    this.find({secretTour: {$ne: true}})
    next();
})

tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, {lower:true});
    next();
})


// // AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({
//         $match:{secretTour: {$ne:true}}
//     })
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;