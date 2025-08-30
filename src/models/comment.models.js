import mongoose, { Schema } from "mongoose";
import { User } from "./user.models";
import { Video } from "./video.model";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = mongoose.Schema(
    {
        content:{
            type: String,
            required: true
        },

        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        video:{
            type: Schema.type.ObjectId,
            ref: "Video"
        }
    }, {timestamps: true})

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)