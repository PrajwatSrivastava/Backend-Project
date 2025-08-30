import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist, getPlaylistById, getUserPlaylists } from "../controllers/playlist.controller.js";

const playlistRoute = Router()
playlistRoute.use(verifyJWT)

playlistRoute.route("/createPlaylist").post(createPlaylist)

playlistRoute.route("/userPlaylist/:userId").get(getUserPlaylists)

playlistRoute.route("/userPlaylistById/:playlistId").get(getPlaylistById)

export {playlistRoute}