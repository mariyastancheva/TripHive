const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const catchAsyncError = require('../utils/catchAsyncError');
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const crypto = require('crypto');
const Email = require('../utils/email');
// const bcrypt = require('bcryptjs');

const signToken = (id) => {
    const token = jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_TOKEN_EXP
    })

    return token;
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24*60*60*1000),
        httpOnly: true
    };

    res.cookie('jwt', token, cookieOptions);

    // to remove these fields from the output
    user.password = undefined;
    user.active = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data:{user}
    })
};

exports.signup = catchAsyncError(async (req, res) => {
    const {name, email, password, passwordConfirm, passwordChangedAt, photo, role} = req.body;
    const newUser = await User.create({
        name,
        email,
        password,
        passwordConfirm,
        passwordChangedAt,
        photo,
        role
    });
    // Sending an email to the new user
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

exports.login = catchAsyncError(async (req, res, next) => {
    const {email, password} = req.body;

    // 1) check if the email and pass exist
    if(!email || !password) return next(new AppError('Please provide email and password!', 400));

    // 2) check if the user and the pass are correct
    const user = await User.findOne({email}).select('+password');

    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything is ok send a token to the client
    createSendToken(user, 200, res);
})

exports.logout = catchAsyncError(async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10*1000),
        httpOnly: true
    });

    res.status(200).json({status: 'success'});
})


exports.protect = catchAsyncError(async (req, res, next)=>{
    // 1) get the token and check if it is there
    let token;
    const authHeader = req.headers['authorization'];
    if(authHeader && authHeader.startsWith('Bearer')){
        token = authHeader.split(' ')[1];
    } else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }

    if(!token){
        return next(new AppError('You are not logged in please login to get access.', 401));
    }
    // 2) Verify the token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) Check if the user still exists

    const freshUser = await User.findById(decoded.id);
    if(!freshUser) {
        return next(new AppError('The token belongs to a user that no longer exists.', 401));
    }

    // 4) Check if changed pass after the token was issued
    if(freshUser.changesPaswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please login again.', 401))
    } 

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    res.locals.user = freshUser;
    next();
})

// only for render pages
exports.isLoggedIn = async (req, res, next)=>{
    try{
        // 1) get the token and check if it is there
        if (req.cookies.jwt){
            const token = req.cookies.jwt;
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
            // 3) Check if the user still exists

            const freshUser = await User.findById(decoded.id);
            if(!freshUser || freshUser.changesPaswordAfter(decoded.iat)) {
                return next();
            }

            // There is a loggedin user
            res.locals.user = freshUser;
        }
        next();
    } catch(err){
        next();
    }  
}


exports.restrictTo = (roles) => (req, res, next) => {
    if(!roles.includes(req.user.role)){
        return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
}

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    // 1) get user based on posted mail
    const user = await User.findOne({email: req.body.email})
    if(!user) {
        return next(new AppError('There is no user with this email address.', 404));
    }

    // 2) generate the random rest token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3) send it to the user's email
    try {
        const resetURL = `${req.protocol}://${req.get(
            'host'
          )}/api/v1/users/resetPassword/${resetToken}`;
          await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to the email!'
        });
    } catch (err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Please try again later!', 500));
    }
})

exports.resetPassword = catchAsyncError(async (req, res, next) => {
    // 1) Get user based on the token and in the same query check if the token is not expired
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});

    // 2) If there is a user 
    if(!user){
        return next(new AppError('Token is invalid or has expired.', 400));
    }
    // 3) set the new pass and the changePassAt prop 
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;

    await user.save();

    // 4) Log the user in and send JWT
    createSendToken(user, 200, res);
})

exports.updatePassword = catchAsyncError(async (req, res, next) => {
    // 1) Get user 
    const user = await User.findById(req.user.id).select('+password');

    // 2) check if the posted pass is correct
    const passwordIsCorrect = await user.correctPassword(req.body.password, user.password);
    if (!passwordIsCorrect){
        return next(new AppError('Your current password is wrong.', 401));
    }

    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // 4) Log the user in and send JWT
    createSendToken(user, 200, res);
})