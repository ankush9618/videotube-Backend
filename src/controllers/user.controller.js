import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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

    if (!email || !userName) { //check if user enter any of the two values
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
        throw new ApiError(402, "Invalid Credentials..")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
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

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "Logout Successful", {})
        )
})

export { registerUser, loginUser, logoutUser };