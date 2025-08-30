// User uploads/send file to server then server makes sure to upload it to cloudinary

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
    cloud_name: 'du7j3jppw', 
    api_key: '486476678763885', 
    api_secret: 'd-g2DlrCSORwxVLVlm_GZKn7jYo'
});


const uploadFile = async (localFilePath) => {
    try {
        console.log(localFilePath)
        if(!localFilePath) {
            console.log(`Value for Local File Path is: ${localFilePath}`)
            return null
        }

        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})
        console.log("File has been uploaded", response.url)

        // Removes locally saved temp file after upload
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        console.log(`Error when uplofing file: ${error}`)
    }
}


export {uploadFile}