import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./apiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded
    console.log("Uploaded successfully", response.url);
    fs.unlinkSync(localFilePath);// if successfull then remove the files from temp
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload opt failed
    return null;

    // console.error("Cloudinary upload failed:", error.message);
    // // Cleanup must not hide the original upload failure.
    // try {
    //   await fs.promises.unlink(localFilePath);
    // } catch (cleanupError) {
    //   if (cleanupError.code !== "ENOENT") {
    //     console.error("Temporary file cleanup failed:", cleanupError.message);
    //   }
    // }
    // throw new ApiError(502, "Image upload to Cloudinary failed");
  }
};

export { uploadOnCloudinary };
