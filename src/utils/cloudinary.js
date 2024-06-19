// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";



// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KRY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return console.log("Path is required ");

//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto",
//         })

//         console.log("File is uploaded on Cloudinary ", response.url);
//         return url;

//     } catch (error) {
//         fs.unlinkSync(localFilePath); // remove the locally saved temporary file as upload operation got failed
//     }
// }

// export {uploadOnCloudinary}

/**
 * 
export const cloudinaryUpload=async (localFilePath)=>{
  try {
    if(!localFilePath) return null
    const responce=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
    console.log("File Uploaded:",responce.url);
    fs.unlinkSync(localFilePath)
    return responce
  } catch (error) {
    fs.unlinkSync(localFilePath)  //remove local temp saved file if operation failed
    return null
  }
}
 */

// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET 
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null
//         //upload the file on cloudinary
//         console.log("loacl path : ",localFilePath)

//         //  const response = await cloudinary.uploader.upload(localFilePath, {
//         //     resource_type: "auto"
//         //  })
//         const responce=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})

//         console.log("heree");

//         console.log("responce",responce);
//         // file has been uploaded successfull
//         //console.log("file is uploaded on cloudinary ", response.url);
//         fs.unlinkSync(localFilePath)
//         return responce;

//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// }



// export {uploadOnCloudinary}







import { v2 as cloudinary } from "cloudinary"
import fs from "fs"



cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // console.log(localFilePath);
        const responce = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
        console.log("File Uploaded:", responce.url);
        fs.unlinkSync(localFilePath)
        return responce
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove local temp saved file if operation failed
        return null
    }
}

export const cloudinaryDelete = async (publicId) => {
    try {
        console.log(publicId);
        const imageUrl = publicId.split('/').pop().split('.')[0];
        const responce = await cloudinary.uploader.destroy(imageUrl);
        if (!responce) {
            //   throw new apiError(401,"Error while deleting data from cloudinary!")
        }
        console.log(responce)
    } catch (error) {
        console.log(error);
        return null
    }
}


export { uploadOnCloudinary }