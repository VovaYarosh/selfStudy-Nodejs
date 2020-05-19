const crypto = require('crypto')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User');


//@ desc    register user
//@route    post /api/v1/auth/register
//@access   public
exports.register = asyncHandler(async (req,res,next) => {
    const { name,email, password, role } = req.body;

    //create user
    const user = await User.create({
        name, 
        email, 
        password, 
        role
    });

    sendTokenResponse(user, 200, res);
});


//@ desc    login user
//@route    post /api/v1/auth/login
//@access   public
exports.login = asyncHandler(async (req,res,next) => {
    const { email, password, } = req.body;

    //validate email& password
    if(!email || !password){
        return next(new ErrorResponse('please provide and email and password', 400));
    }

    //check for user
    const user = await User.findOne({email}).select('+password');

    if(!user){
        return next(new ErrorResponse('invalid credentials', 401));
    }

    //check if password matches
    const isMatch = await user.matchPassword(password);

    if(!isMatch){
        return next(new ErrorResponse('invalid credentials', 401));
    }
    
    sendTokenResponse(user, 200, res);
});


//@ desc    login user
//@route    post /api/v1/auth/lme
//@access   private

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req,user.id);

    res.status(200).json({
        success: true,
        data: user
    });
})


//@ desc    forgot password
//@route    post /api/v1/auth/forgotpassword
//@access   public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new ErrorResponse('There is no user with that email', 404))
    }

    //get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false })

    //create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/resetpassword/${resetToken}`;
    const message = `......to: \n\n ${resetUrl}`;

    try {
       await sendEmail({
           email: user.email,
           subject: 'password reset token',
           message
       }); 

       res.status(200).json({
           success: true,
           data: 'email sent'
       });
    } catch (err) {
        console.log(err);
        user.getResetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('Email could not be sent', 500));
    }

    res.status(200).json({
        success: true,
        data: user
    });
})

//@ desc    reset password
//@route    post /api/v1/auth/resetpassword/: resettoken
//@access   public

exports.resetPassword = asyncHandler(async (req, res, next) => {
    //get hashed token
    const resetPasswordToken = crypto
    .createHash('sha256')
    .uodate(req.params.resetToken)
    .digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now()}
    });

    if(!user){
        return next(new ErrorResponse('invalid token', 400))
    }

    //set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);;
})

//get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) =>{
    //Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + proccess.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production'){
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({success: true, token})
}
