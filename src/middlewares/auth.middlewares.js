import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'; 
import { user } from "../models/user.model.js";

// writing middlewares for suthentication and getting if user is logged in with the logic if user has access token we can decode it to get
//user id and other information 

const authVerify = asyncHandler(async(req,_,next)=>{

   //seting up a try catch block 

   try {

      //we are geeting accessToken from user and also ther bearer token form the user as send either in cookie or header 

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
      console.log(token);
 // if token not find then we think it is unauthorized request 

    if(!token){
      console.log("ram")
     throw new ApiError(400,"Unauthorised request")

    }
     // we are now decoding the token using our seckret key from which we have encrypted 

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    console.log("29");
    // we are storing the decoded token in iser and chekinf if there is id with the access token talking to the databse 

    const foundUser = await user.findById(decodedToken?._id).select("-password -refreshToken")
    console.log("33");
    //if iser is null this simply means that the access token is invalid 
    if(!foundUser){

      //error regarding this

     throw new ApiError(400,"Invalid access token")

    }
    //giving user details in user  
    req.foundUser = foundUser
    console.log("44");
    next()

   } catch (error) {

// invalid world you are trying to access
      console.log("lol")
    throw new ApiError(401, error?.message || "Invalid access token")    

   }
   
}) 

export { authVerify }