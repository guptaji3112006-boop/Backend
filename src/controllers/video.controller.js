import mongoose, { isValidObjectId } from "mongoose";
import { video as Video } from "../models/video.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pageNumber = Number(page);
  const pageSize = Number(limit);

  if (
    !Number.isSafeInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new ApiError(400, "Page and limit must be positive integers");
  }

  const filter = { isPublished: 1 };

  if (userId !== undefined) {
    if (typeof userId !== "string" || !isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }
    filter.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query !== undefined) {
    if (typeof query !== "string") {
      throw new ApiError(400, "Query must be a string");
    }
    const search = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
  }

  const sortField = sortBy ?? "createdAt";

  if (
    !["createdAt", "updatedAt", "title", "views", "duration"].includes(
      sortField,
    )
  ) {
    throw new ApiError(400, "Invalid sort field");
  }

  if (
    sortType !== undefined &&
    !["asc", "desc", "1", "-1"].includes(sortType)
  ) {
    throw new ApiError(400, "Invalid sort type");
  }

  const sortDirection = sortType === "asc" || sortType === "1" ? 1 : -1;

  const aggregate = Video.aggregate([
    { $match: filter },
    { $sort: { [sortField]: sortDirection, _id: sortDirection } },
  ]);

  const videos = await Video.aggregatePaginate(aggregate, {
    page: pageNumber,
    limit: pageSize,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim()
  ) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  if (!uploadedVideo?.secure_url || !Number.isFinite(uploadedVideo.duration)) {
    throw new ApiError(502, "Video upload failed");
  }

  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!uploadedThumbnail?.secure_url) {
    throw new ApiError(502, "Thumbnail upload failed");
  }

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: uploadedVideo.secure_url,
    thumbnail: uploadedThumbnail.secure_url,
    duration: uploadedVideo.duration,
    owner: req.user._id,
    isPublished: 1,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Video published successfully", video));
});

const findVideo = async (videoId, userId, requireOwner = false) => {
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const isOwner = video.owner?.toString() === userId?.toString();

  if (requireOwner && !isOwner) {
    throw new ApiError(403, "Only the owner can modify this video");
  }
  if (!requireOwner && !video.isPublished && !isOwner) {
    throw new ApiError(404, "Video not found");
  }

  return video;
};

const getVideoById = asyncHandler(async (req, res) => {
  const video = await findVideo(req.params.videoId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const video = await findVideo(req.params.videoId, req.user._id, true);
  const { title, description } = req.body ?? {};
  const updates = {};

  for (const [field, value] of Object.entries({ title, description })) {
    if (value !== undefined) {
      if (typeof value !== "string" || !value.trim()) {
        throw new ApiError(400, `${field} must be a non-empty string`);
      }
      updates[field] = value.trim();
    }
  }

  if (req.file?.path) {
    const thumbnail = await uploadOnCloudinary(req.file.path);
    if (!thumbnail?.secure_url) {
      throw new ApiError(502, "Thumbnail upload failed");
    }
    updates.thumbnail = thumbnail.secure_url;
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(
      400,
      "Provide a title, description, or thumbnail to update",
    );
  }

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: video._id, owner: req.user._id },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", updatedVideo));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const video = await findVideo(req.params.videoId, req.user._id, true);
  const deletedVideo = await Video.findOneAndDelete({
    _id: video._id,
    owner: req.user._id,
  });
  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", {}));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const video = await findVideo(req.params.videoId, req.user._id, true);
  const updatedVideo = await Video.findOneAndUpdate(
    { _id: video._id, owner: req.user._id },
    [
      {
        $set: { isPublished: { $cond: [{ $eq: ["$isPublished", 1] }, 0, 1] } },
      },
    ],
    { new: true },
  );
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Publish status updated successfully", updatedVideo),
    );
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
