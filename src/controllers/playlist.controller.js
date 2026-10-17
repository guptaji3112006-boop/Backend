import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import { video } from "../models/video.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  if (typeof description !== "string" || !description.trim()) {
    throw new ApiError(400, "Playlist description is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, " Invalid user id ");
  }

  const playlists = await Playlist.find({ owner: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully ", playlists));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id ");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, " Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, " Playlist fetched successfully ", playlist));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id ");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id ");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, " Playlist does not exist");
  }

  const Video = await video.findById(videoId);

  if (!Video) {
    throw new ApiError(404, " Video  does not exist");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own playlists");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true, runValidators: true },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, " video added in the Playlist ", updatedPlaylist),
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id ");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id ");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, " Playlist does not exist");
  }

  const Video = await video.findById(videoId);

  if (!Video) {
    throw new ApiError(404, " Video  does not exist");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own playlists");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true, runValidators: true },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        " video removed from the Playlist ",
        updatedPlaylist,
      ),
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own playlists");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, " Playlist deleted successfully", {}));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id ");
  }

  const updates = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      throw new ApiError(400, "Playlist name cannot be empty");
    }
    updates.name = name.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string" || !description.trim()) {
      throw new ApiError(400, "Playlist description cannot be empty");
    }
    updates.description = description.trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Provide a name or description to update");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, " Playlist not found");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updates },
    { new: true, runValidators: true },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, " Playlist updated successfully ", updatedPlaylist),
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
