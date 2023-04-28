const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const handlersFactory = require('./handlersFactory');
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsyncError( async (req, res, next) => {
    if(!req.file) return next();

    const imageFormat = 'jpeg';
    const fileName = `user-${req.user.id}-${Date.now()}.${imageFormat}`;
    req.file.filename = fileName;

    await sharp(req.file.buffer).resize(500, 500).toFormat(imageFormat).jpeg({quality: 90}).toFile(`public/img/users/${fileName}`);

    next();
});

const filterObj = (obj, fieldsArr) => {
   return Object.keys(obj).reduce((result, key) => {
        if (fieldsArr.includes(key)) {
        result[key] = obj[key];
        }
        return result;
    }, {});
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.getUsers = handlersFactory.getAll(User);
exports.getUser = handlersFactory.getOne(User);
exports.deleteUser = handlersFactory.deleteOne(User);
exports.updateUser = handlersFactory.updateOne(User);

exports.updateMe = catchAsyncError(async(req, res, next) => {
    // 1) Throw error if the user tries to update the password
    if (req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for updating the password. Please use the /updatePassword route.', 400));
    }

    // 2) update the user
    const filteredBody = filterObj(req.body, ['name', 'email']);
    if(req.file) filteredBody.photo = req.file.filename;

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {new:true, runValidators: true});
    res.status(200).json({
        status: 'success',
        user
    })
});

exports.deleteMe = catchAsyncError(async (req, res, next)=>{
    await User.findByIdAndUpdate(req.user.id, {
        active: false
    })

    res.status(204).json({
        status: 'succes',
        data: null
    });
});