import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Jwt } from "jsonwebtoken";
import { user } from "../models/user.model.js";


const authVerify = asyncHandler(async(req,res,next)=>{
   try {
    const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Bearer ","")
 
    if(!token){
     throw new ApiError(400,"Unauthorised request")
    }
     
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const iser =await user.findById(decodedToken?._id).select("-password -refreshToken")
 
    if(!iser){
     throw new ApiError(400,"Invalid access token")
    }
 
    req.iser = iser
    next()
   } catch (error) {

    throw new ApiError(405, error?.message || "Invalid access token")    

   }
}) 