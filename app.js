const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingsRouter = require('./routes/bookingRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const app = express();
const compression = require('compression');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(compression())
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));



// This limits 100 req for one hour per IP
const oneHour =  60 * 60 * 1000;
const limiter = rateLimit({
    max: 100,
    windowMs: oneHour,
    message: 'Too many requests from this IP, please try again in an hour.'
})
app.use('/api', limiter);

// Converting the req body to json (Body parser) and limits the body size to 10 KB
app.use(express.json({limit: '10kb'}));

// Parses the data from the cookie
app.use(cookieParser());

// Data sanitization against NOSQL query injecttion
app.use(mongoSanitize());

// Data sanitization against
app.use(xss());

// Stands for HTTP Parameter Polution - not to do /tours?sort=price&sort=duration some of the fileds are  white listed in order to allow multiple of them
app.use(hpp({
    whiteList: ['duration', 'price', 'difficulty', 'maxGroupSize', 'ratingsAverage', 'ratingsQuantity']
}));


// Providing routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingsRouter);

app.all('*', (req, res, next)=>{
    const error = new AppError(`Could not find ${req.originalUrl} route.`, 404);
    next(error);
})

app.use(globalErrorHandler);

module.exports = app;