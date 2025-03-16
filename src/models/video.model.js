import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = mongoose.Schema({ //creating video schema
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
        required: true,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate); //adding a plugin to use mongooseAggregatePaginate

export const Video = mongoose.model("Video", videoSchema);