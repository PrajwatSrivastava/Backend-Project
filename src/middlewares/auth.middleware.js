import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

// verifyJWT is the ID check at the exit gate — making sure it’s really you who’s leaving, 
// not some stranger trying to kick you out.

// Without verifyJWT 😬
// Anyone could send a POST request to /logout.
// They could try to log out someone else’s account (if they somehow knew their token value in a DB or session).
// The backend wouldn’t even know if the request was from a valid user.

// With verifyJWT 🛡️
// The middleware runs before logoutUser.
// It:
// Checks if the token exists (so user must be logged in).
// Verifies that the token is valid and untampered.
// Finds the user in the DB.
// Attaches the req.user object so logoutUser knows exactly which user is logging out.
// Only after that does logoutUser run and actually:
// Clear their refreshToken from DB.
// Clear their access token from cookies.
// End the session.

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log("token :", token)

        if (!token) {
            throw new ApiErrors(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiErrors(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid access token")
    }
    
})