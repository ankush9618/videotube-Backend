import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const validateJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req?.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "Unauthorized Access");
    }

    const verifiedToken = jwt.verify(token, process.env.ACCESS_KEY_SECRET);
    if (!verifiedToken) {
        throw new ApiError(502, "Unable to fetch token value")
    }

    const user = await User.findById(verifiedToken?._id).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(401, "Invalid Access Token")
    }
    req.user = user;
    next();
})

export { validateJWT }