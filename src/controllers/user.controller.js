import { asyncHandler } from "../utils/AsyncHandler.js";
import {ApiErrors} from "../utils/ApiErrors.js"
import { User} from "../models/user.models.js"
import {uploadFile} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  {mongoose, isValidObjectId } from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        //while saving(.save()), fields required in schema also gets kikked in i.e when saving refreshtoken to db password 
        //n avatar fields also need to be saved, therefore we use validatebeforesave=false means save without any check||freely
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiErrors(500, error.message,  "Something went wrong while generating referesh and access token")
    }
}



const registerUser = asyncHandler(async (req, res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiErrors(400, "All fields are required")
    }

    // a db call to check user existence using await is mandatory
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiErrors(409, "User with email or username already exists")
    }

    // Check for avatar file
    if (!req.files.avatar) {
        throw new ApiErrors(400, "Avatar file is required")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadFile(avatarLocalPath)
    const coverImage = await uploadFile(coverImageLocalPath)
   

    // create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    console.log(createdUser)

    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while registering the user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})



const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(req.body)

    if(!username && !email){
        return res.json(new ApiErrors(400, "Please enter username or email"))
    }

    const user = await User.findOne({$or: [{username}, {email}]})

    if (!user) {
        return res.json(new ApiErrors(404, "User does not exist"))
    }


    //Checkpoint=> problem solved
    // const hashedPass = await bcrypt.hash(password, 10)
    // console.log(hashedPass)
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        return res.json(new ApiErrors(401, "Invalid user credentials"))
    }

    // 
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    // .select() basically does not fetch mentioned attr in it from db
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})



const logoutUser = asyncHandler(async(req, res) => {
    //when user logout refresh token should be removed from db
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


// Access tokens expire quickly for security.

// Without refresh tokens, users would have to log in every time their access token expires.

// Refresh tokens allow seamless re-authentication while still keeping access tokens short-lived and safer.

// Proper verification + rotation protects against token replay attacks.

const refreshAccessToken = asyncHandler(async (req, res) => {

    // We first check the user's cookies or request body for a refresh token.
    // Why? Because the user’s short-lived access token might have expired
    // but they still have a long-lived refresh token to prove they logged in earlier.

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiErrors(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        // Makes sure this refresh token belongs to a real user
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiErrors(401, "Invalid refresh token")
        }
    
        // This prevents token theft. Even if someone stole an old refresh token, if it doesn’t match the current one stored in the DB, it’s rejected.
        // Also handles cases where user logged out or the token was rotated.
        if (incomingRefreshToken !== user?.refreshToken)  {
            throw new ApiErrors(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        // This is token rotation — old refresh token gets replaced to reduce security risk.
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid refresh token")
    }

})



const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body


    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiErrors(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})



const getCurrentUser = asyncHandler(async(req, res) => {
    // Fetch user from DB to ensure latest data and exclude sensitive fields
    const user = await User.findById(req.user?._id).select("-password -refreshToken");
    console.log(user)
    if (!user) {
        throw new ApiErrors(404, "User not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200, //statuscode
        user, // data
        "User fetched successfully" // message
    ))
})



const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiErrors(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});



const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadFile(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiErrors(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})



const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiErrors(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadFile(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiErrors(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


// To be understood later
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {user} = req.params
    console.log(user)

    if (user) {
        return res.json(new ApiErrors(404, "Please enter Username or Id"))
    }

    let matchCondition = {};
    if(isValidObjectId(user)){
        matchCondition._id = new mongoose.Types.ObjectId(user);
    }
    else{
        matchCondition.username = user.toLowerCase();
    }

    // this is a bad idea, since we are doing 2 db calls that creates a performance issue(90ms to 160ms)
    // const channelExists = await User.exists({username: userName.toLowerCase()})

    // if (!channelExists) {
    //     throw new ApiErrors(404, "Channel does not exist")
    // }

    const channel = await User.aggregate([
        {
            $match: {
                ...matchCondition
                // _id: matchCondition._id
                // username: matchCondition.username
            }
        },
        {
            $lookup: {
                from: "subscriptions",   // Name of the other collection
                localField: "_id",       // Field in current collection
                foreignField: "channel", // Field in the other collection to match
                as: "subscribers"        // Field name for matched results
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        return res.json(new ApiErrors(404, "Channel does not exist"))
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            // Filters the User collection to get only the logged-in user (whose ID is in req.user from verifyJWT).
            // This ensures we don’t fetch everyone’s history — just theirs.
            $match: {
            // only when using mongoose aggregation functions, we need to decode the objectId stored in DB to string for matching            
                _id: new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup: {
                from: "videos",             // Name of the other collection
                localField: "watchHistory", // Field in current collection
                foreignField: "_id",        // Field in the other collection to match
                as: "watchHistory",         // Field name for matched results
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})



export {registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser,
    changeCurrentPassword, updateAccountDetails, updateUserAvatar, 
    updateUserCoverImage, getUserChannelProfile, getWatchHistory}
