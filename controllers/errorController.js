const AppError = require("../utils/appError");

const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el=>el.message).join('. ')
    const message = `Invalid input data. ${errors}`;
    return new AppError(message, 400);
}

const sendErrorForDev = (err, req, res) => {
    //API
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack
        })
    }
    // Rendered website

    res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    })
}

const handleDuplicateFields = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
}

const handleJWTExpiredError = () => new AppError('Your token has expired, please log in again.', 401);

const handleJWTError = () => {
    return new AppError('Invalid token, Please log in again!', 401);
}

const sendErrorForProd = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')){
        // Operational error (which I proramatically handled in catch block)
        if (err.isOperational){
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            })
        } 
        // Other unknwn error
        else{
            // Log error
            console.error('Error💥', err);

            // Send generic message
            return res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            })
        }
    } 
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    })
    
}

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') sendErrorForDev(err, req, res)
    else {
        let error = {...err, message: err.message};
        const errorProto = Object.getPrototypeOf(err);
        if(errorProto.name === 'CastError') error = handleCastError(err);
        if(errorProto.name === 'ValidationError') error = handleValidationError(err);
        if(error.code === 11000) error = handleDuplicateFields(err);
        if(error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
        sendErrorForProd(error, req, res);
    }
};

module.exports = globalErrorHandler;