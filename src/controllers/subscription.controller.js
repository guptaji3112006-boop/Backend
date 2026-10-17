import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.js";

import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import { subscription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  if (channelId === subscriberId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const channel = await User.exists({ _id: channelId });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const existingSubscription = await subscription.findOneAndDelete({
    channel: channelId,
    subscriber: subscriberId,
  });

  if (!existingSubscription) {
    await subscription.create({
      channel: channelId,
      subscriber: subscriberId,
    });
  }

  const isSubscribed = !existingSubscription;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        isSubscribed
          ? "Channel subscribed successfully"
          : "Channel unsubscribed successfully",
        { isSubscribed },
      ),
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channel = await User.exists({ _id: channelId });

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscribe = await subscription
    .find({
      channel: channelId,
    })
    .populate("subscriber", "username fullName avatar")
    .sort({ createdAt: -1 })
    .lean();

  const subscribedVideo = subscribe
    .map((subscription) => subscription.subscriber)
    .filter(Boolean);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "subscribed videos fetched successfully",
        subscribedVideo,
      ),
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, " subsciber Id not found");
  }

  const subscriptions = await subscription.find({
    subscriber: subscriberId,
  }).populate("channel");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "subscribed channel fetched successfully ", {
        subscriberId,
      }),
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
