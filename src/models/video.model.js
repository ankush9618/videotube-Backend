import mongoose from "mongoose";

const videoSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    }
});

export const Video = mongoose.model("Video", videoSchema);