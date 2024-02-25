import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import {user} from "../models/user.model.js";
import mongoose from "mongoose";

const genrateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const User = await user.findById(userId);
        const accesToken = User.genrateAccessToken();
        console.log("accestoken")
        console.log(accesToken); // Ensure this prints the access token
        const refreshToken = User.genrateRefreshToken();
        console.log("refreshtoken")
        console.log(refreshToken); // Ensure this prints the refresh token
        User.refreshToken = refreshToken;
        User.save({ validateBeforeSave: false });
        console.log("avtar")
        console.log(accesToken);
        return { accesToken, refreshToken }; // Check spelling, should be "accessToken"
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
    throw new ApiError(400,"dp de ")
}
if (!coverlocalpath){
    throw new ApiError(400,"cdp de ")
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


export  {
    registerUser,
    logInUser,
    logOutUser
}   
       