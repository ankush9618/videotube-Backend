import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        console.log("File uploaded successfully to cloudinary", cloudinaryResponse.url);
        return cloudinaryResponse;
    }
    catch (err) {
        fs.unlinkSync(localFilePath)//remove the locally saved data sync
        console.log("Error Uploading File to Cloudinary", err);
        return null;
    }
}

export { uploadToCloudinary };