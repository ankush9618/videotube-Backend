import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
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

router.route("/refresh-token").post(refreshAccessToken);

export default router;