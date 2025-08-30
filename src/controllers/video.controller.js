import { Video } from "../models/video.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import {getVideoDurationInSeconds} from "get-video-duration";
import { uploadFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import mongoose, {isValidObjectId} from "mongoose"


// const getAllVideos = asyncHandler(async (req, res)=>{
//     // show vedio, thumbnail, title, description, duration, owner(USerId)

//     // steps to fetch all vedios from db
//     const {page = 1, limit = 10, query, userId} = req.query

//     const vedios = await Video.find()

//     if(!vedios){
//         throw new ApiErrors(500, "Something went wrong while fethcing vedios")
//     }

//      return res.status(201).json(
//         new ApiResponse(200, vedios, "Videos fetched successfully")
//     )
// })

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filter = {};

    //fetch vedios which are set to published by user
    filter.isPublished = true

    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // case-insensitive search
    }

    // Sorting order: ascending (1) or descending (-1)
    const sortOrder = sortType === 'asc' ? 1 : -1;

    // Pagination skip/limit
    const skip = (page - 1) * limit;

    const totalVideos = await Video.countDocuments(filter); // count total
    const totalPages = Math.ceil(totalVideos / limit);

    // Fetch videos from DB
    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit));

    if(videos.length === 0) {
        return res.status(404).json(new ApiResponse(
            404,
            [],
            "No videos found"
        ));
    }

    return res.status(200).json(new ApiResponse(
        200, //statuscode
        {
            page: Number(page),
            limit: Number(limit),
            totalVideos,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            videos
        }, // data
        "Videos fetched successfully" // message
    ))
});



const publishAVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body

    if(!title.trim() || !description.trim()){
        throw new ApiErrors(400, "title and description is required")
    }
    // TODO: get video, upload to cloudinary, create video

    if(!req.files?.videoFile){
        throw new ApiErrors(400, "Video file is required")
    }

    if(!req.files?.thumbnail){
        throw new ApiErrors(400, "Thumbnail file is required")
    }
    
    const videoPath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    const duration = await getVideoDurationInSeconds(videoPath)

    const videoFile = await uploadFile(videoPath)
    const thumbnailFile = await uploadFile(thumbnailPath)    


    // create video
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url || "", //TODO: code for making thumbnail automatically
        title, 
        description,
        duration: duration,
        owner: req?.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200, //statuscode
        video, // data
        "Video published successfully" // message
    ))
})


// Separate API for adding a video to watch history
// video1- 689ee13e1398334bb0ef1a97
// video2- 689ee14b1398334bb0ef1a9a
const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.query; 
    console.log(videoId)

    const userId = req.user._id; // Assuming user ID is available in req.user
    console.log(userId)

    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { watchHistory: videoId } },
        { new: true }
    );

    return res
    .status(200)
    .json(new ApiResponse(
        200, //statuscode
        User, // data
        "VedioId saved in watch history" // message
    ));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    //check for params and find vedio by Id
    //validate vedioId and user
    //find n fetch doc containing vedioId from db

    if(!videoId){
        throw new ApiErrors("Please provide videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) throw new ApiErrors("Video Id not found")
    
    return res.status(200).json(new ApiResponse(
        200,
        video, // User.findById(video.owner.toString()).select("-password -refreshToken"),
        "Video fetched successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { title, description, thumbnail } = req.body;
    const { videoId } = req.params; // Assuming videoId is passed in URL like /videos/:videoId

    // 1. Check if videoId is provided
    if (!videoId) {
        throw new ApiErrors("Vedio Id is required")
    }

    // 2. Find the video and check if it exists
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiErrors(404, "Video not found");
    };

    // 3. Check if logged-in user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiErrors(403, "User not found or mismatch")
    }

    // 4. Update fields (only if provided)
    if (title) video.title = title;
    if (description) video.description = description;
    if (thumbnail) video.thumbnail = thumbnail;

    await video.save();

    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video updated successfully"
    ));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    //TODO: delete video

    //check for params and find vedio by Id
    //validate vedioId and user
    //find n delete doc containing vedioId from db

    if(!videoId){
        throw new ApiErrors("Please provide videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) throw new ApiErrors("Video Id not found")

    if(video.owner.toString() !== req.user._id.toString()) throw new ApiErrors("You are not Authorized")

    await video.deleteOne()
    console.log("Video deleted successfully", video)

    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video deleted successfully"
    ))
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!videoId) {
        throw new ApiErrors(400, "Video ID is required");
    }

    const video = await Video.findById(videoId)

    if(!video) throw new ApiErrors("Video Id not found")

    if(video.owner.toString() !== req.user._id.toString()) throw new ApiErrors("You are not Authorized")
    
    // Toggle the isPublished status
    video.isPublished = !video.isPublished;  //If it is true becomes false and vice versa
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(
        200,
        video,
        `Video publish status toggled to ${video.isPublished}`
    ))
})

export {getAllVideos, publishAVideo, addToWatchHistory, getVideoById, updateVideo, deleteVideo, togglePublishStatus}