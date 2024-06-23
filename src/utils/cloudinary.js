import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"


  

    const uploadFileOnCloudinary=async(localFilePath)=>{
        cloudinary.config({ 
            cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`, 
            api_key: `${process.env.CLOUDINARY_API_KEY}`, 
            api_secret: `${process.env.CLOULINARY_SECRET_KEY}`
        })
try {
    if(!localFilePath) return null;
    //upload on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:'auto',
    })
    //dev temp start
console.log("File uploaded on cloudinary ",response.url)
      //dev temp end
      fs.unlinkSync(localFilePath)
      return response.url;
} catch (error) {
     //dev temp start
     console.log(error)
      //dev temp end
    fs.unlinkSync(localFilePath)
    return null;
}
    }


    export {uploadFileOnCloudinary}