import mongoose from "mongoose";
import { video as Video } from "../models/video.js";
import { subscription as Subscription } from "../models/subscription.models.js";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  const channelId = new mongoose.Types.ObjectId(req.user._id);
  const [videoStats, totalSubscribers] = await Promise.all([
    Video.aggregate([
      { $match: { owner: channelId } },
      {
        $lookup: {
          from: Like.collection.name,
          localField: "_id",
          foreignField: "video",
          pipeline: [{ $count: "count" }],
          as: "likes",
        },
      },
      {
        $group: {
          _id: null,
          totalVideoViews: { $sum: "$views" },
          totalVideos: { $sum: 1 },
          totalLikes: {
            $sum: { $ifNull: [{ $arrayElemAt: ["$likes.count", 0] }, 0] },
          },
        },
      },
      { $project: { _id: 0 } },
    ]),
    Subscription.countDocuments({ channel: channelId }),
  ]);

  const stats = {
    totalVideoViews: 0,
    totalVideos: 0,
    totalLikes: 0,
    ...videoStats[0],
    totalSubscribers,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, "Channel stats fetched successfully", stats));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  const videos = await Video.find({ owner: req.user._id }).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Channel videos fetched successfully", videos));
});

export { getChannelStats, getChannelVideos };
