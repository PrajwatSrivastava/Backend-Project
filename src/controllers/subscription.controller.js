import mongoose, {isValidObjectId} from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/AsyncHandler.js"


// controller to subscribe and unsubscribe
const toggleSubscription = asyncHandler(async (req, res) => {

    //logic
    // validate such that user apne hi channel ko subscribe n krle
    // req.params contains the userID of channel to be subscribed
    // req.user._id contains the user subscribing to the channel
    // store these two into db as a doc of subscription schema(subscriber and channel)
    // before saving check:
        // check if user already subscribed
        // user already subscribed -> unsubscribe
        // user not subscribed -> subscribe


    const {channelId} = req.params
    if(!isValidObjectId(channelId)) return res.json(new ApiErrors(401, "Invalid channel ID"))


    const user = req.user._id
    if(!user) throw new ApiErrors("User not found")

    if(channelId.toString() === user.toString()) return res.json(new ApiErrors(400, "Hahaha good for you"))

    
    const existingSubscription = await Subscription.findOne({
        subscriber: user,
        channel: channelId,
    });


    if (existingSubscription) {
        const deleteSubscription = await Subscription.deleteOne({ _id: existingSubscription._id });

        return res.status(200)
        .json(new ApiResponse(
            200, 
            deleteSubscription,
            "Unsubscribed successfully"
        ))
    } else {
        const newSubscription = await Subscription.create({
        subscriber: user,
        channel: channelId,
        });

        return res.status(200)
        .json(new ApiResponse(
            200, 
            newSubscription,
            "Subscribed successfully"
        ))
    }
    
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    //logic
    // validate params n user                                
    // fetch all doc that contains channel=channelId if channelId not valid or missing then channel=user.id
    const channelId = req.params

    const user = req.user._id
    if(!user) return res.json(new ApiErrors("User not found"))

    const { targetID, message } = isValidObjectId(channelId) 
    ? { targetID: channelId, message: "Subscriber count fetched successfully for requested channel" }
    : { targetID: user, message: "Invalid or missing channelId, showing your channel subscribers instead" };
    

    const subscriberCount = await Subscription.countDocuments({channel: targetID})

    return res.status(200)
    .json(new ApiResponse(
        200, 
        subscriberCount,
        message
    ));

})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    //logic
    // validate params n user                                
    // fetch all doc that contains channel=subscriberId if subscriberId not valid or missing then susbscriber=user.id

    const { subscriberId } = req.params

    const user = req.user._id
    if(!user) return res.json(new ApiErrors("User not found"))

    const { targetID, message } = isValidObjectId(subscriberId) 
    ? { targetID: subscriberId, message: "Subscriber count fetched successfully for requested channel" }
    : { targetID: user, message: "Invalid or missing channelId, showing your channel subscribers instead" };
    

    const subscriberCount = await Subscription.countDocuments({subscriber: targetID})

    return res.status(200)
    .json(new ApiResponse(
        200, 
        subscriberCount,
        message,
        "Subscriber count fetched successfully"
    ))

})

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}