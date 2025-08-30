import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// controller to create a tweet
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { tweet } = req.body
    
    const tweetContent = tweet.trim()
    if(!tweetContent) return res.json(new ApiErrors(400, "Field missing"))

    const user = req.user._id
    if(!user) throw new ApiErrors("User not found")

    const savedTweet = await Tweet.create({
        content: tweetContent,
        owner: user
    })

    return res.status(200).json({
        status: 200,
        data: savedTweet,
        message: "Tweet created successfully"
    })
})

// controller to get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    if(!isValidObjectId(userId)) return res.json(new ApiErrors(400, "Invalid userId"))

    const userTweets = await Tweet
        .find({owner: userId})
        .populate("owner", "username email")
        .sort({createdAt: -1})

    // if no tweets found
    if (!userTweets.length) {
        return res.status(404).json(new ApiResponse(
            400, 
            userTweets,
            "no tweets found"
        ));
    }

    console.log(userTweets)

    return res.status(200).json(new ApiResponse(
        statusCode= 200,
        data= userTweets,
        message= "Tweets fetched successfully"
    ))
})

const getAllTweets = asyncHandler(async (req, res) => {
    // fetch username & email of owner
    // latest tweets first

  const tweets = await Tweet.find()
    .populate("owner", "username email")
    .sort({ createdAt: -1 }); 

  return res.status(200).json({
    status: 200,
    data: tweets,
    message: "All tweets fetched successfully",
  });
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweet} = req.body
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) return res.json(new ApiErrors(400, "Invalid tweetID"))


    const newTweet = tweet.trim()
    if(!newTweet) return res.json(new ApiErrors(400, "Field missing"))
    
    
    const userId = req.user._id
    if(!userId) return res.json(new ApiErrors(401, "User Not found"))
    
    const updatedTweet = await Tweet.findOneAndUpdate(
        {_id: tweetId, owner:userId},
        {$set:{content: newTweet}},
        {new:true}
    )
    console.log(updateTweet)
    if (!updatedTweet) {
        return res.status(403).json(new ApiErrors(403, "Not authorized or Tweet not found"));
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateTweet, "Tweet updated successfully")
    ) 
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        return res.status(400).json(new ApiErrors(400, "Invalid tweetID"));
    }

    const userId = req.user._id;

    // single query - find tweet by id and owner and delete
    const deletedTweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: userId });

    if (!deletedTweet) {
        return res.status(403).json(new ApiErrors(403, "Not authorized or Tweet not found"));
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deleteTweet, "Tweet deleted successfully")
    );

})

export {createTweet, getUserTweets, getAllTweets, updateTweet, deleteTweet}