const Tour = require('./../models/tourModel');
const catchAsyncError = require('../utils/catchAsyncError.js');
const handlersFactory = require('./handlersFactory.js');
const AppError = require('../utils/appError');

const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    }else{
        cb(new AppError('Not an image. Please upload only images.', 400), false)
    }
}
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

exports.resizeTourImages = catchAsyncError(async (req, res, next) => {
    if(!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    const imageFormat = 'jpeg';
    const fileName = `tour-${req.params.id}-${Date.now()}-cover.${imageFormat}`;
    req.body.imageCover = fileName;

    await sharp(req.files.imageCover[0].buffer).resize(2000, 1333).toFormat(imageFormat).jpeg({quality: 90}).toFile(`public/img/tours/${fileName}`);
  
    // 2) images
    req.body.images = [];
    const proccessedImages = req.files.images.map(async (file, i) => {
        const fileName = `tour-${req.params.id}-${Date.now()}-${i+1}.${imageFormat}`;

        await sharp(file.buffer).resize(2000, 1333).toFormat(imageFormat).jpeg({quality: 90}).toFile(`public/img/tours/${fileName}`);
        req.body.images.push(fileName);
    });

    await Promise.all(proccessedImages);

    next();
});


exports.aliasTopTours = (req, res, next) => {
    req.query = {
        limit: '5',
        sort: 'ratingsAverage,price'
    }
    next();
};

exports.getAllTours = handlersFactory.getAll(Tour);
exports.getTour =  handlersFactory.getOne(Tour, {path: 'reviews'}); 
exports.updateTour = handlersFactory.updateOne(Tour);
exports.createTour = handlersFactory.createOne(Tour);
exports.deleteTour = handlersFactory.deleteOne(Tour);

exports.getTourStats = catchAsyncError(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte:4.5}}
        },
        {
            $group:{
                _id: '$difficulty',
                numTours: {$sum: 1},
                numRatings: {$sum:'$ratingsQuantity'},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'},
            }
        },
        {
            $sort:{
                avgPrice: 1
            }
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
});

exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group:{
                _id: {$month: '$startDates'},
                numToursStarts: {$sum: 1},
                tours: {$push: '$name'}
            }
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            $project:{
                _id:0
            }
        }, 
        {
            $sort: {numToursStarts: -1}
        }
        
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
})

///tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsyncError(async(req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const radiusOfTheEarthInMiles = 3963.2;
    const radiusOfTheEarthInKm = 6378.1;
    const radius = unit === 'mi' ? distance / radiusOfTheEarthInMiles : distance / radiusOfTheEarthInKm;

    if (!lat || !lng){
        return next(new AppError('Please provide latitude and longtitude in the format lat,lng.', 400))
    }

    const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}});

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: tours
    })
});

exports.getDistances = catchAsyncError(async(req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng){
        return next(new AppError('Please provide latitude and longtitude in the format lat,lng.', 400))
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [+lng, +lat]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },{
            $project:{
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: distances
    })
});
