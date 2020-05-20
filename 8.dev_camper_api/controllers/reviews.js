const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');

//@ desc    get reviews
//@route    get /api/v1/reviews
//@route    get /api/v1/bootcamps/:bootcampId/reviews
//@access   public
exports.getReviews = asyncHandler(async (req,res,next) => {
    if(req.params.bootcampId){
        const reviews = await Review.find({ bootcamp: req.params.bootcampId});

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        })
    }else{
        res.status(200).json(res.advancedResults);    
    }   
});


//@ desc    get single review
//@route    get /api/v1/reviews/:id
//@access   public
exports.getReview = asyncHandler(async (req,res,next) => {
   const review = await Review.findById(req.params.id).populate({
       path: 'bootcamp',
       select: 'name description'
   }); 
   
   if(!review){
    return next(new ErrorResponse(`No review found with the id of ${req.params.id}`,404))
   }

   res.status(200).json({
       success: true,
       data: review
   })
});

//@ desc    add review
//@route    post /api/v1/bootcamps/:bootcampId/reviews
//@access   public
exports.addReview = asyncHandler(async (req,res,next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if(!bootcamp){
        return next(new ErrorResponse(
            `no bootcamp with the id of ${req.params.bootcampId}`,
            404)
        );
    }

    const review = await Review.create(req.body);
 
    res.status(200).json({
        success: true,
        data: review
    })
 });

//@ desc   update review
//@route    put /api/v1/reviews/:id
//@access   public
exports.updateReview = asyncHandler(async (req,res,next) => {
    let review = await Review.findById(req.params.id);

    if(!review){
        return next(new ErrorResponse(
            `no review with the id of ${req.params.id}`,
            404)
        );
    }

    //make sure review belongs to user or user is admin
    if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(
            `not authorized to update review`,
            401)
        );
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body,{
        new: true,
        runValidators: true
    })
 
    res.status(200).json({
        success: true,
        data: review
    })
 });


 //@ desc   delete review
//@route    delete /api/v1/reviews/:id
//@access   public
exports.deleteReview = asyncHandler(async (req,res,next) => {
    const review = await Review.findById(req.params.id);

    if(!review){
        return next(new ErrorResponse(
            `no review with the id of ${req.params.id}`,
            404)
        );
    }

    //make sure review belongs to user or user is admin
    if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(
            `not authorized to update review`,
            401)
        );
    }

    await review.remove();
 
    res.status(200).json({
        success: true,
        data: review
    })
 });