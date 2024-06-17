import { v2 as cloudinary } from "cloudinary";
import fs from "fs";



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KRY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return console.log("Path is required ");

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        console.log("File is uploaded on Cloudinary ", response.url);
        return url;

    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as upload operation got failed
    }
}


export {uploadOnCloudinary}

