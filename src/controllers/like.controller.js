import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import { video as Video } from "../models/video.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.exists({ _id: videoId });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!existingLike) {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  }

  const isLiked = !existingLike;

  return res.status(200).json(
    new ApiResponse(200, isLiked ? "Video liked" : "Video unliked", {
      isLiked,
    }),
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const Comment = await comment.exists({ _id: commentId });
  if (!Comment) {
    throw new ApiError(404, "Comment not found ");
  }

  const existingComment = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!existingComment) {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
  }
  const isLiked = !existingComment;

  return res
    .status(200)
    .json(new ApiResponse(200, isLiked ? " comment Liked" : "comment Unliked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, " Invalid tweet id ");
  }

  const Tweet = await tweet.exists({ _id: tweetId });
  if (!Tweet) {
    throw new ApiError(404, "Tweet not  found ");
  }

  const existinglike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!existinglike) {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
  }

  const isLiked = !existinglike;

  return res
    .status(200)
    .json(new ApiResponse(200, isLiked ? "Tweet liked" : "Tweet unliked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  })
    .populate("video")
    .sort({ createdAt: -1 })
    .lean();

  const likedVideos = likes.map((like) => like.video).filter(Boolean);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Liked videos fetched successfully", likedVideos),
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
