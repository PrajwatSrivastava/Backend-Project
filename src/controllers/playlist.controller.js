import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";



const createPlaylist = asyncHandler(async (req, res)=>{

    const {name, description} = req.body

    if(!name || !description) {
        return res.status(201).json(
            new ApiErrors(
                201,
                "Fields missing",
                Error.captureStackTrace
            )
        )
    }

    const user = req.user._id

    if(!user) throw new ApiErrors(400, "User not found")

    
    const playList = await Playlist.create({
        name:name,
        description:description,
        owner: user
    })

    if(!playList){
        throw new ApiErrors(201, "Couldn't create playlist")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playList,
            "Playlist created successfully"
        )
    )
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiErrors(
            200,
            "User not found"
        )
    }

    const userPlaylist = await Playlist.find(
        {owner: userId}
    ).populate("owner", "username email avatar")

    if(!userPlaylist){
        throw new ApiErrors(
            201,
            "Problem when fetching user playlist"
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            userPlaylist,
            "User playlist fetched successfully"
        )
    )
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiErrors(
            400,
            "Invalid playlistId"
        )
    }

    const playlist = await Playlist.findById(playlistId)
    .populate("owner", "username email")

    if(playlistId){
        return res.status(201).json(
            new ApiResponse(
                201,
                playlist,
                "Playlist not found"
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})




export {createPlaylist, getUserPlaylists, getPlaylistById}