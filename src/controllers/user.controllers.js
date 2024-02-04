import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import {user} from "../models/user.model.js";

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

export  {
    registerUser
}   
       