import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

const uploadToCloudinary = async (localFilePath) => { //Function to upload image on Cloudinary
    try {
        if (!localFilePath) return null;
        const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        //console.log("File uploaded successfully to cloudinary", cloudinaryResponse.url);
        fs.unlinkSync(localFilePath);
        return cloudinaryResponse;
    }
    catch (err) {
        fs.unlinkSync(localFilePath)//remove the locally saved data sync
        console.log("Error Uploading File to Cloudinary", err);
        return null;
    }
}



const deleteFromCloudinary = async (cloudinaryUrl) => { //Function to delete image from Cloudinary
    try {
        // Ensure the Cloudinary Public ID is extracted from the URL
        const regex = /\/([^\/]+)(?=\.[a-z]+$)/;
        const match = cloudinaryUrl.match(regex);
        const cloudinaryPublicId = match ? match[1] : null;

        if (!cloudinaryPublicId) {
            throw new ApiError(400, "Cloudinary Public ID is required");
        }

        // Delete asset from Cloudinary
        const deletedResponse = await cloudinary.api.delete_resources([cloudinaryPublicId], { resource_type: "image" });

        // Check if the response indicates success
        if (deletedResponse?.deleted?.[cloudinaryPublicId] === 'deleted') {
            return deletedResponse;
        } else {
            // Log the detailed response from Cloudinary for debugging
            throw new ApiError(501, "Error during Deleting from Cloudinary");
        }
    } catch (error) {
        // Log the error and re-throw as ApiError
        throw new ApiError(501, "Error during Deleting from Cloudinary");
    }
};



export { uploadToCloudinary, deleteFromCloudinary };