import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import { SERVER_OPTIONS } from "../constants.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => { //method to create user
    const { userName, fullName, email, password } = req.body;//taking data from req.bdy and destructuring it..

    if ([userName, email, fullName, password].some((item) => item?.trim() === "")) { //checking if any field is empty or not
        throw new ApiError(400, "All The Fields are Required to Proceed..");
        //res.status(401).json(response);
    }
    //console.log(req.body)

    const userExists = await User.findOne({ //finding for the user if the user already exists.
        $or: [{ userName }, { email }]
    });
    if (userExists) {
        throw new ApiError(409, "UserName or Email already Exits..");
    }

    const avatarFilePath = req.files?.avatar[0]?.path; //using multer getting file path
    //const coverImagePath = req.files?.coverImage[0]?.path;

    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path;
    }

    //console.log(req.files)

    if (!avatarFilePath) {
        throw new ApiError(400, "Avatar is Required to Proceed..")
    }

    const avatar = await uploadToCloudinary(avatarFilePath); //uplading to cloudinary
    const coverImage = await uploadToCloudinary(coverImagePath);

    //console.log(avatar)

    if (!avatar) {
        throw new ApiError("505", "Failed Uploading Image to Cloudinary..");
    }

    const user = await User.create( //creating a new user
        {
            userName: userName.toLowerCase(),
            email,
            fullName,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || ""
        }
    );

    const createdUser = await User.findById(user._id).select("-password -refreshToken");//finding for the user after creating

    if (!createdUser) {
        throw new ApiError(504, "Error registering user in Database");
    }
    //console.log(createdUser);
    return res.status(201).json(
        new ApiResponse(200, "User Registered Successfully..", createdUser)
    )



})

const loginUser = asyncHandler(async (req, res) => { //method to login user
    const { email, userName, password } = req.body;

    if (!email && !userName) { //check if user enter any of the two values
        throw new ApiError(401, "Email or UserName is Required to Proceed..");
    }

    const user = await User.findOne({ //finding user with email or userName
        $or: [{ email }, { userName }]
    });

    if (!user) {
        throw new ApiError(400, "UserName or Email does not exists");
    }
    const validPassword = await user.isPasswordCorrect(password); // checking if the entered password is correct or not
    if (!validPassword) {
        throw new ApiError(401, "Invalid Credentials..")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // const options = {
    //     httpOnly: true,
    //     secure: true
    // }

    return res
        .status(200)
        .cookie("accessToken", accessToken, SERVER_OPTIONS)
        .cookie("refreshToken", refreshToken, SERVER_OPTIONS)
        .json(
            new ApiResponse(
                200,
                "Login Successful",
                {
                    user: loggedInUser, accessToken, refreshToken
                }
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    );

    // const options = {
    //     httpOnly: true,
    //     secure: true
    // }

    return res
        .status(200)
        .clearCookie("accessToken", SERVER_OPTIONS)
        .clearCookie("refreshToken", SERVER_OPTIONS)
        .json(
            new ApiResponse(200, "Logout Successful", {})
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => { //generating new access and refresh token
    try {
        const incommingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!incommingRefreshToken) {
            throw new ApiError(401, "Unauthorized Request");
        }
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_KEY_SECRET);
        if (!decodedToken) {
            throw new ApiError(400, "Invalid Refresh Token");
        }
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(400, "Invalid Refresh Token");
        }
        if (incommingRefreshToken !== user.refreshToken) {
            throw new ApiError(400, "Refresh token Expired or Used");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, SERVER_OPTIONS)
            .cookie("refreshToken", refreshToken, SERVER_OPTIONS)
            .json(
                new ApiResponse(200, "Access Token Refreshed Successfully", { accessToken, refreshToken })
            )
    } catch (error) {
        throw new ApiError(402, "Invalid Refresh Token");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => { //Change Current Password
    const { currentPassword, password } = req.body;
    if (currentPassword === password) {
        throw new ApiError(403, "New Password must be different from Current Password");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(402, "Invalid Operation");
    }
    const isValidPassword = await user.isPasswordCorrect(currentPassword);
    if (!isValidPassword) {
        throw new ApiError(402, "Current Password is incorrect");
    }

    user.password = password;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(
            new ApiResponse(200, "Password Changed Successfully")
        );
})

const getUserDetails = asyncHandler(async (req, res) => { //Fetch USer Details
    return res
        .status(200)
        .json(
            new ApiResponse(200, "User Data Fetched Successfully", req.user)
        )
})

const updateUserDetails = asyncHandler(async (req, res) => { //Update User FullName and Email
    const { fullName, email } = req.body;
    //console.log(fullName, email)
    if (!fullName || !email) {
        throw new ApiError(401, "Name and Email is Required to Proceed");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(401, "Invalid Operation");
    }
    user.fullName = fullName;
    user.email = email;
    await user.save({ validateBeforeSave: false });
    const updatedUser = await User.findById(user._id).select("-password -refreshToken");
    return res
        .status(200)
        .json(
            new ApiResponse(200, "Details Updated Successfully", updatedUser)
        );

})

const updateAvatar = asyncHandler(async (req, res) => { //Update Avatar
    const avatarFilePath = req.file?.path;
    if (!avatarFilePath) {
        throw new ApiError(401, "Avatar Image is Required");
    }

    const avatar = await uploadToCloudinary(avatarFilePath);
    if (!avatar) {
        throw new ApiError(501, "Error Uplading avatar to Coludinary");
    }
    console.log(req.user)
    const avatarUrl = req.user?.avatar;
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");
    const deletedResponse = await deleteFromCloudinary(avatarUrl);
    if (!deletedResponse) {
        throw new ApiError(501, "Error deleting file from Cloudinary")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, "Avatar Updated Successfully", user)
        )
})

const updateCoverImage = asyncHandler(async (req, res) => { //Update Cover Image
    const coverImageFilePath = req.file?.path;
    if (!coverImageFilePath) {
        throw new ApiError(401, "Cover Image Image is Required");
    }

    const coverImage = await uploadToCloudinary(coverImageFilePath);
    if (!coverImage) {
        throw new ApiError(501, "Error Uplading Cover Image to Coludinary");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");


    return res
        .status(200)
        .json(
            new ApiResponse(200, "Cover Image Updated Successfully", user)
        )
})

const getUserProfile = asyncHandler(async (req, res) => { //get User Profile Page
    const { userName } = req.params;

    if (!userName) {
        throw new ApiError(400, "Invalid Request")
    }

    const channel = await User.aggregate([
        {
            $match: { userName }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                userName: 1,
                email: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                fullName: 1,
                coverImage: 1,
                avatar: 1,
                isSubscribed: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(400, "Channel Does Not Exists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "User Profile Fetched Successfully", channel[0])
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getUserDetails,
    updateUserDetails,
    updateAvatar,
    updateCoverImage
};