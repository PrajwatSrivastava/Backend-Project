import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, getAllTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

const tweetRoutes = Router();
tweetRoutes.use(verifyJWT)


tweetRoutes.route("/uploadTweet").post(createTweet);

tweetRoutes.route("/userTweets/:userId").get(getUserTweets);

tweetRoutes.route("/allTweets").get(getAllTweets);

tweetRoutes.route("/updateTweet/:tweetId").get(updateTweet);

tweetRoutes.route("/deleteTweet/:tweetId").get(deleteTweet);

export {tweetRoutes}