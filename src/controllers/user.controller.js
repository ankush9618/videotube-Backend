import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
    const { userName, fullName, email, password } = req.body;

    if ([userName, email, fullName, password].some((item) => item?.trim() === "")) {
        throw new ApiError(400, "All The Fields are Required to Proceed..");
        //res.status(401).json(response);
    }

    const userExists = await User.findOne({
        $or: [{ userName }, { email }]
    });
    if (userExists) {
        throw new ApiError(409, "UserName or Email already Exits..");
    }

    const avatarFilePath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;

    if (!avatarFilePath) {
        throw new ApiError(400, "Avatar is Required to Proceed..")
    }

    const avatar = await uploadToCloudinary(avatarFilePath);
    const coverImage = await uploadToCloudinary(coverImagePath);

    if (!avatar) {
        throw new ApiError("505", "Failed Uploading Image to Cloudinary..");
    }

    const user = await User.create(
        {
            userName: userName.toLowerCase(),
            email,
            fullName,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || ""
        }
    );

    const createdUser = User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(504, "Error registering user in Database");
    }

    return res.status(201).json(
        new ApiResponse(200, "User Registered Successfully..")
    )



})

export { registerUser };