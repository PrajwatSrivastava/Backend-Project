import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },{timestamps:true}
)


// This function runs automatically before saving a user document
userSchema.pre("save", async function(next) {
    // If the password is NOT modified or changed or updated from old to new password by user (like when updating username or email),
    // we should skip hashing it again — it's already hashed.
    if(!this.isModified("password")) return next()
    
    // If password is new or changed, we hash it    
    this.password = await bcrypt.hash(this.password, 10)
    next()
})



// 🔍 What it does:
// This checks if the password entered by the user is correct.

// 💡 How?
// password: This is the password user types when logging in (like "mypassword123").

// this.password: This is the hashed password saved in your database.

// ✅ bcrypt.compare
// It decrypts and checks if the entered password matches the saved hashed password.

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


// 🔍 What it does:
// It creates an Access Token for the user — a secure token that proves the user is logged in.

// ⚙️ What’s inside the token:
// The user’s ID, email, username, and full name.

// It's digitally signed with a secret key (ACCESS_TOKEN_SECRET) so it can't be faked.

// It has an expiry time, like 15m or 1h (ACCESS_TOKEN_EXPIRY).

// 🛡️ Why use it?
// You give this token to the client (frontend), and every time the user makes a request, they send this token to prove "Hey, I’m still logged in!"


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


// 🔍 What it does:
// Creates a Refresh Token, which is a longer-lasting token used to get a new Access Token after the current one expires.

// 📌 What’s different?
// Only includes _id for minimal info.

// Uses a different secret (REFRESH_TOKEN_SECRET).

// Has a longer expiration, like 7d or 30d.


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema)