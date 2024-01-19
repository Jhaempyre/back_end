import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {user} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadcloud} from "../utils/cloudnary.js";
const registerUser = asyncHandler(async(req, res) => {
   
    const {fullname, username , password , email}= req.body
    console.log("email:",email);

   // if (fullname ===""){
       // throw new ApiError(400,"FULL NAAM CAAHIYE")

    //}

    if (
        [fullname,username , password , email].some((feild) => feild?.trim()=== "")
        ) {
            throw new ApiError(400,"ALL feild are required")
        }
   const existeduser= user.findOne({
        $or:[{username}, {email}]
    })    
if(existeduser){
    throw new ApiError(409,"user exsisit")
}

const avtarloaclpath = req.files?.avtar[0]?.path;
const coverlocalpath = req.files?.coverImage[0]?.path;

if (!avtarloaclpath){
    throw new ApiError(400,"dp de ")
}

const avtar = await uploadcloud(avtarloaclpath)
const coverImage= await uploadcloud(coverlocalpath)
if (!avtar){
    throw new ApiError(400,"dp de ")
}
const user = await user.create({
    fullname,
    avtar:avtar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
})

const createdUser= await user.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"server ne bakchodi kr di")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"user succesfully registered")
)

})

export  {registerUser}   
       