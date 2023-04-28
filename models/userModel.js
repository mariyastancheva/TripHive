const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'The name is required.'],
        min: [2, "Name must be at least 2 chars."],
        max: [30, "Name must not be more than 30 chars."]
    },
    email:{
        type: String,
        required: [true, 'The email is required.'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    photo:{
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password:{
        type:String,
        required: [true, 'The password is required.'],
        min: [6, "Password must be at least 6 chars."],
        max: [30, "Password must not be more than 30 chars."],
        select: false
    },
    passwordConfirm:{
        type:String,
        required: [true, 'The password is required.'],
        validate: {
            validator: function(value){
                return value === this.password;
            },
            message: 'Both passwords should match.'
        }
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});
userSchema.pre('save', async function (next) {
    // only run if pass was modified
    if(!this.isModified('password')) return next();

    // hashes pass with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    //deletes the passConfirm field as it is not needed in the db
    this.passwordConfirm = undefined;

    // This is for when the pass is changed
    if(!this.isNew){
        this.passwordChangedAt = Date.now() - 1000;
    }
    next();
})

userSchema.pre(/^find/, function (next){
    this.find({active: {$ne: false}});
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changesPaswordAfter = function(JWTTimestamp){
    if (this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function (){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;