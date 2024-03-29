import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import {user} from "../models/user.model.js";
import jwt from "jsonwebtoken";
//import mongoose from "mongoose";
//import { application } from "express";

const genrateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const User = await user.findById(userId);
        const accessToken = User.genrateAccessToken();
        //console.log("accestoken")
        //console.log(accesToken); // Ensure this prints the access token
        const refreshToken = User.genrateRefreshToken();
        //console.log("refreshtoken")
        //console.log(refreshToken); // Ensure this prints the refresh token
        User.refreshToken = refreshToken;
        User.save({ validateBeforeSave: false });
        //console.log("avtar")
        
        return { accessToken, refreshToken }; // Check spelling, should be "accessToken"
    } catch (error) {
        throw new ApiError(420, "You are not authorised");
    }
};


const registerUser = asyncHandler( async(req, res) => {
   
    const { fullname, username , password , email } = req.body

    if (
        [fullname , username , password , email].some((field) => field?.trim()=== "")
        ) {
            throw new ApiError(400,"ALL feild are required")
        }

   const existeduser = await user.findOne({
    $or: [{username},{email}]

   })

if(existeduser){
    throw new ApiError(409,"user exsisit")
}
//console.log(req.files)

//const avtarlocalpath = req.files?.avtar[0]?.path;
//const coverlocalpath = req.files?.coverImage[0]?.path;
let avtarlocalpath;
if(req.files && Array.isArray(req.files.avtar) && req.files.avtar.length > 0){
    avtarlocalpath = req.files.avtar[0].path
}
console.log(avtarlocalpath)

let coverlocalpath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverlocalpath = req.files.coverImage[0].path
}
console.log(coverlocalpath)

if (!avtarlocalpath){
    throw new ApiError(400,"please provide the displaying profile avtar image")
}
if (!coverlocalpath){
    throw new ApiError(400,"please provide the cover image for further process ")
}

const avtar = await uploadOnCloudinary(avtarlocalpath)
const coverImage = await uploadOnCloudinary(coverlocalpath)

if (!avtar){
    //throw new ApiError(400,"dp de ")
}
if(!coverImage){
    //bhai chalja
}
const newuser = await user.create({
    fullname,
    avtar:avtar?.url || "",
    coverImage:coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
})

//console.log(avtar.url);

const createdUser= await user.findById(newuser._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"server ne bakchodi kr di")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"user succesfully registered")
)

})
// the problem coming was user.ispassword correct is not function since i was using moongose given user
// directly it is meant to be urnon method not as function but 
//then i made an instance of user and worked with that and it worked all wher ei suggest keep the name
// easy and diffrentiable so that clashes and confusion wont occur 

//chek here "https://github.com/Automattic/mongoose/issues/5260"
// also here  "https://chat.openai.com/share/8fdc7634-5a78-4e21-8d92-1a159fab7bf4"
const logInUser = asyncHandler(async(req,res)=>{
    //get email id and password 
    
    const {username , password , email } = req.body
    //chek if they came or not 

    if (!(email || username )){
        throw new ApiError(500,"username or email is required ")
    }
    //chek for email id and username in db 
    const User = await user.findOne({
        $or : [{username},{email}]
    })
    // if user not found then 
    if (!User) {
        throw new ApiError(404, "User does not exist")
    }
    //console.log(User)
    // chek for password 
    const isPasswordValid = await User.isPasswordCorrect(password)
    // if invalid , result false 
    console.log("job validated")
    if (!(isPasswordValid)){
       throw new ApiError(405, "invalid credential")
    }
    //if valid make correct 
    //genrate access and refresh tokens 

    const {accessToken, refreshToken} = await genrateAccessTokenAndRefreshToken(User._id)

    const loggedInUser = await user.findById(User._id).select("-password -refreshToken")
    console.log(loggedInUser)
    // send  cookkie to the user form server 

    const options = {
        httpOnly : true ,
        secure : true
    }

  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
        200, 
        {
            User: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
)
})

const logOutUser = asyncHandler(async(req,res)=>{
     // chek form miidle ware is user looged in 
     await user.findByIdAndUpdate(
        req.foundUser._id,
        {
            $unset:{
                refreshToken : 1
            }
        }, 
            {
                new : true
            }
     )
     const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

//updating refeshtoken so that user don't need to sign in again and again with password 
//we will update refreshtoken 
//this is now okay 
/*problem that came were 
1)cookies is used not cookie 
2)i was using another key for that which results into jsonWebTokenError = jwt invalid signature
*/

const updateRefreshToken = asyncHandler(async(req,res)=>{
    //get refreshtoken from cookies aur body
    //console.log(req.cookies.refreshToken)
    const cookieRefreshToken = (req.cookies.refreshToken) || (req.body.refreshToken)
    //console.log(cookieRefreshToken)
    if(!cookieRefreshToken){
        throw new ApiError(400,"You are not Uthorised")
    }
//i was using another key for that which results into jsonWebTokenError = jwt invalid signature

    const decodedRefresh = jwt.verify(cookieRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    console.log("decodedRefresh");
    console.log(decodedRefresh)
    const User = await user.findById(decodedRefresh?._id)
    //console.log(User)
    if (!User){
        throw new ApiError(402,"You are not authorised")
    }

    if(cookieRefreshToken !== User?.refreshToken){
        throw new ApiError(403,"refresh token is used & need to login again")
    }
    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken : newAccessToken, refreshToken:newRefreshToken} = await genrateAccessTokenAndRefreshToken(User._id)
   /* console.log("accesstoken")
    console.log(accessToken);
    console.log("refreshToken")
    console.log(refreshToken)*/

    return res
    .status(200)
    .cookie("accessToken",newAccessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(
            200,{
            User,
            accessToken :newAccessToken,
            refreshToken:newRefreshToken,
            },
            "Access token refreshed"
        )
    )

    }
)

const updatePassword = asyncHandler(async(req,res)=>{
    //if user is ok:then get password from rew.body
    const {oldPassword, newPassword} = req.body
    //chek if both password has been paassed , 
    if(!(oldPassword||newPassword)){
        throw new ApiError(400,"Enter old and new password")
    }
    // get user id 
    //req.founder is used to get it beacuse it's coming from midddleware 
    const User = await user.findById(req.foundUser?._id);
 
    // chek if password is correct
    const validation = await User.isPasswordCorrect(oldPassword)
    // chekckung the validation 
    if (!validation){
        throw new ApiError(402,"Enter correct passsword")
    }
    //update password to database and get user 
    User.password = newPassword
    await User.save({validateBeforeSave: false})

    return res.status(200)
    .json( new ApiResponse(
        200,
        {},
        "password changed succesfully"
    ))

})

const getCurrentUserDetails = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            {
                User : req.foundUser
            },
            "User Details fetched succesfully"

        )
        )
})

//updating user details 

const updateUserDetails = asyncHandler(async(req,res)=>{
    //get email and fullname with user , 
    const {fullname , email} = req.body
    //chek if they came 
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    //talk to database and update them 

    const newUser = await user.findByIdAndUpdate(
        req.foundUser?._id,
        {
            $set :{                 //this set the new data to the document 
                fullname : fullname ,
                email : email
            }
        },
        {new: true}
    ).select("-password")
    // return new user 

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            {
                newUser
            },
            " Details updated succesfully"

        )
        )
})

//updating avtarImage

const updateAvtarImage = asyncHandler(async(req, res) => {
    let avtarLocalPath;
    //console.log("Request file:", req.file); // Logging request file for debugging
    if (req.file) {
        avtarLocalPath = req.file.path;
    }
    //console.log("Avtar local path:", avtarLocalPath); // Logging avtarLocalPath for debugging
    if (!avtarLocalPath) {
        throw new ApiError(400, "Please provide the displaying profile avatar image");
    }

    const avtarImage = await uploadOnCloudinary(avtarLocalPath);

    if (!avtarImage) {
        throw new ApiError(400, "Something went wrong. Please try again");
    }

    const User = await user.findById(req.foundUser?._id);
    const email = User.email;
    console.log("User email:", email); // Logging user email for debugging

    const oldAvtarUrl = User.avtar;
    // Will work on deleting from cloudinary just after once upload is done 
    User.avtar = avtarImage.url || "";
    await User.save({ validateBeforeSave: false });

    return res.status(200)
        .json(new ApiResponse(
            200, {
                User
            },
            "Avatar changed successfully"
        ));
});

//updating coverImage

const updateCoverImage = asyncHandler(async(req,res)=>{
    let coverLocalPath ;

    if (req.file){
        coverLocalPath = req.file.path;
    }

    console.log("coverloacalpath",coverLocalPath)

    if(!coverLocalPath){
        throw new ApiError(400,"please provoide the coverImage")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverLocalPath){
        throw new ApiError(402,"something went wrong . please try again later")
    }

    const User = await user.findById(req.foundUser?._id)

    const oldCoverImage = User.coverImage

    User.coverImage = coverImage?.url || ""

    await User.save({validateBeforeSave:false})

    //this could be a approach too :)
/*  const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
}) */







    return res.status(200)
    .json( new ApiResponse(
        200,
        {
            User
        },
        "coverImage changed succesfully"
    ))

})

export  {
    registerUser,
    logInUser,
    logOutUser,
    updateRefreshToken,
    updatePassword,
    getCurrentUserDetails,
    updateUserDetails,
    updateAvtarImage,
    updateCoverImage
}   
       