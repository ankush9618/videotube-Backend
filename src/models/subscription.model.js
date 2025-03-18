import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: { //one who has subscribed
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channel: { //one to whom we have subscribed
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema);