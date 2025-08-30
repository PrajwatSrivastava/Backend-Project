/*express: to handle web requests

cors: to allow your frontend to connect

cookieParser: to handle browser cookies

routes: defines what happens when someone visits your app*/

import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// use is typically a middleware stuff
// CORS- cross origin resourse sharing 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// Data can be in any form i.e: url, json, json form.....thereby setting data limitations is imp
app.use(express.json({limit:"16kb"}))


// A times searched keyword may appear diff in form of url i.e: ice crea => ice+cream or ice%20cream where %20 represents space
app.use(express.urlencoded({extended:true, limit:"16kb"}))

// A times we need to store image files, pdf files on server side and make it assessible publically
app.use(express.static("public"))

// Perform CURD operations on cookies only serves can access these secure cookies
app.use(cookieParser())



import userRouter from "./routes/user.routes.js";
import {videoRouter} from "./routes/video.routes.js";
import { subscriptionRoute } from "./routes/subscription.routes.js"
import { tweetRoutes } from "./routes/tweet.routes.js"
import { playlistRoute } from "./routes/playlist.routes.js"


app.use("/api/v1/users", userRouter)

app.use("/api/v1/videos", videoRouter)

app.use("/api/v1/subscription", subscriptionRoute)

app.use("/api/v1/tweets", tweetRoutes)

app.use("/api/v1/playlist", playlistRoute)

export {app}