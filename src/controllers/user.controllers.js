import {asyncHandler} from "../utils/asyncHandler.js"
const registerUser = asyncHandler(async(req,res)=>{
    res.status(200,{
        message:"jai Mahakaal"
    })
})
export default registerUser