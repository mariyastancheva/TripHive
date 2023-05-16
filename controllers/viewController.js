const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsyncError');

exports.getOverview = catchAsyncError(async(req, res) => {
    const tours = (await Tour.find()).map(tour => tour.toObject({virtuals: true}));
    res.render('overview',{
        title: 'All Tours',
        tours
    });
});

exports.getAboutus = (req, res) => {
    res.render('aboutus',{
        title: 'About us'
    });
};

exports.getBecomeGuide = (req, res) => {
    res.render('becomeGuide',{
        title: 'Become a Guide'
    });
};

exports.getContact = (req, res) => {
    res.render('contact',{
        title: 'Contact'
    });
};

exports.getTour = catchAsyncError(async(req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews', fields: 'review rating user'
    });
    if(!tour){
        return next(new AppError('There is no tour with that name', 404));
    }

    res.status(200).set(
        'Content-Security-Policy',
        "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;"
      ).render('tour', {
          title: tour.name,
          tour
      });
});

exports.getLogin = catchAsyncError(async(req, res) => {
   res.status(200).render('login',{
    title: 'Log into your account'
   })
});

exports.getSignup = catchAsyncError(async(req, res) => {
    res.status(200).render('signup',{
     title: 'Create your account'
    })
 });

exports.getAccount = (req, res) => {
    res.status(200).render('account',{
     title: 'Your account'
    })
 };

exports.updateUserData = catchAsyncError(async(req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id,{
        name: req.body.name,
        email: req.body.email
    },{
        new: true, runValidators: true
    })
    res.status(200).render('account',{
     title: 'Your account',
     user:updatedUser
    })
 });

 exports.getMyTours = catchAsyncError(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
  
    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    res.status(200).render('overview', {
      title: 'My Tours',
      tours,
      message: tours.length === 0 ? 'Currently you do not have any booked tours. Thats a pity 😕 so go ahaid and ...' : undefined
    });
  });