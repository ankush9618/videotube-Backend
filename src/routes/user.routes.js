import { Router } from "express";
import { changeCurrentPassword, getUserDetails, getUserProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAvatar, updateCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post( //creating localhost:3000/api/v1/user/register route and uploading files in server
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser); //logging user

router.route("/logout").post(validateJWT, logoutUser); //logout user

router.route("/refresh-token").post(refreshAccessToken); //refresh Access Token

router.route("/change-password").post(validateJWT, changeCurrentPassword); // Change Current Password

router.route("/get-user-details").get(validateJWT, getUserDetails); //Fetch user details

router.route("/update-user-details").patch(validateJWT, updateUserDetails); //update user details

router.route("/update-avatar").patch(//udate avatar image
    validateJWT,
    upload.single("avatar"),
    updateAvatar
);

router.route("/update-coverImage").patch(//udate Cover image
    validateJWT,
    upload.single("coverImage"),
    updateCoverImage
);

router.route("/user/:userName").get(validateJWT, getUserProfile); //get User Channel Profile 

router.route("/watch-history").get(validateJWT, getWatchHistory);  // get User Watch History

export default router;