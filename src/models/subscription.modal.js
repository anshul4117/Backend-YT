import mongoose, { Schema, mongo } from "mongoose";

const subscriptionSchema = new Schema({
    suscriber: {
        type: Schema.Types.ObjectId, //
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timeseries: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)