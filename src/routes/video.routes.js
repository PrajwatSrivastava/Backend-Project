import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { publishAVideo, getAllVideos, addToWatchHistory, updateVideo, deleteVideo, togglePublishStatus, getVideoById } from "../controllers/video.controller.js";

const videoRouter = Router()
videoRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

videoRouter.route("/publish-vedio")
            .post( upload.fields([
                {
                    name: "videoFile",
                    maxCount: 1,
                },
                {
                    name: "thumbnail",
                    maxCount: 1,
                },
            ]), publishAVideo)

videoRouter.route("/allVideos").get(getAllVideos);

videoRouter.route("/watch").get(addToWatchHistory);

videoRouter.route("/vedioById/:videoId").get(getVideoById);

videoRouter.route("/updateVedio/:videoId").get(updateVideo);

videoRouter.route("/deleteVideos/:videoId").get(deleteVideo);

videoRouter.route("/togglePublishStatus/:videoId").get(togglePublishStatus)

// videoRouter
//     .route("/")
//     // .get(getAllVideos)
//     .post(
        // upload.fields([
        //     {
        //         name: "videoFile",
        //         maxCount: 1,
        //     },
        //     {
        //         name: "thumbnail",
        //         maxCount: 1,
        //     },
            
        // ]),
        // publishAVideo
//     );

// videoRouter
//     .route("/:videoId")
//     .get(getVideoById)
//     .delete(deleteVideo)
//     .patch(upload.single("thumbnail"), updateVideo);

// videoRouter.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export {videoRouter}