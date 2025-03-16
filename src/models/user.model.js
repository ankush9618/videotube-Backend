import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({ //creating user schema
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

userSchema.pre("save", async function (next) { //using pre hook to check if the password is been modified and encrypting it before creating user.
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) { //method to check if the password is correct or not.
    return bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async function () { //method to generate Access token
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_KEY_SECRET,
        {
            expiresIn: process.env.ACCESS_KEY_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = async function () { //method to generate Refresh token
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_KEY_SECRET,
        {
            expiresIn: process.env.REFRESH_KEY_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema);