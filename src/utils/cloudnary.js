import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.LOUDINARY_API_SECRET
});

const uploadcloud= async(loacalFilePath)=>{
    try {
        if (!loacalFilePath) return null
        //upload
        const response = await cloudinary.uploader.upload(loacalFilePath,{
            resource_type:"auto"
        })
        //file sucess
        console.log("file is uploadaed",
        response.url);
    
        return response;
        
    } catch (error) {
        fs.unlinkSync(loacalFilePath)
        return null 
        
    }
}

export{uploadcloud}


 