import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import {user} from "../models/user.model.js";

const genrateAccessTokenAndRefreshToken = async(userId)=>{
   try {
     //finding user and gettinf it's id 
     const User = user.findById(userId)
     //genrate access token
     const accesToken = user.genrateAccessToken()
     // genrate refrseh token
     const refreshToken = user.genrateRefreshToken()
     User.refreshToken = refreshToken
     User.save({validateBeforeSave: false })

     return {accesToken, refreshToken}
 
 } 
    catch (error) {
    throw  new ApiError(420,"you are not authorised ")
   }
}  

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

const logInUser = asyncHandler(async(req,res)=>{
    //get email id and password 
    
    const {username, email, password } = req.body
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
    // chek for password 
    const isPasswordValid = await user.isPasswordCorrect(password)
    // if invalid , result false 
    if (!isPasswordValid){
        throw new ApiError(405, "invalid credential")
    }
    //if valid make correct 
    //genrate access and refresh tokens 

    const {accesToken, refreshToken} = genrateAccessTokenAndRefreshToken(User._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
)
})

const logOutUser = asyncHandler(async(req,res)=>{
     // chek form miidle ware is user looged in 
    // if user logged in then on chek make refrehtoken false 
    //bring your cookies back 

})

export  {
    registerUser,
    logInUser
}   
       