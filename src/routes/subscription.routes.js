import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";


const subscriptionRoute = Router()
subscriptionRoute.use(verifyJWT)

subscriptionRoute.route("/toggleSubscription/:channelId").get(toggleSubscription)

subscriptionRoute.route("/channelSubscribers/:channelId").get(getUserChannelSubscribers)

subscriptionRoute.route("/subscribedChannel/:subscriberId").get(getSubscribedChannels)

export {subscriptionRoute}