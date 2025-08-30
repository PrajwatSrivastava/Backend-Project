import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref: "User"
    }
}, {timestamps: true})


// When model is exported and saved to DB, Mongoose automatically creates a collection named 'subscriptions' in plural form.
// Subscription => subscriptions (lowercase, and pluralized)
export const Subscription = mongoose.model("Subscription", subscriptionSchema)