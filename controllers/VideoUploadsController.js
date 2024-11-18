const fs = require("fs").promises;
const path = require("path");
const Fashion = require("../models/fashionModel.js");
const Videos = require("../models/VideoClipsModel.js");
const { errorHandler } = require("../middlewares/errorHandling.js");

const UPLOAD_DIR = "uploads/";

// Utility function to delete a file
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted ${filePath}`);
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error);
  }
};

const UploadVideo = async (req, res, next) => {
  try {
    const { title, category } = req.body;

    const slug = title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const existingVideo = await Videos.findOne({ slug });
    if (existingVideo) {
      return res.status(400).json({ message: "Video with same title exists" });
    }

    if (!req.files || !req.files.image) {
      return next(errorHandler(400, "Image cover is required"));
    }

    const imageUrl = `/uploads/${req.files.image[0].filename}`;
    const videoClipUrl = req.files.videoClip
      ? `/uploads/${req.files.videoClip[0].filename}`
      : null;

    const newVideo = new Videos({
      title,
      category,
      slug,
      image: imageUrl,
      videoClip: videoClipUrl,
    });

    const savedVideo = await newVideo.save();
    res.status(201).json(savedVideo);
  } catch (error) {
    console.error("Error in creating VideoClip:", error);
    next(error);
  }
};

const updateVideo = async (req, res, next) => {
  try {
    const { VideoId } = req.params;
    const updateData = req.body;

    let video = await Videos.findById(VideoId);

    if (!video) {
      return next(errorHandler(404, "Video post not found"));
    }

    const updateFields = {};

    ["title", "category"].forEach((field) => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        updateFields[field] = updateData[field];
      }
    });

    if (req.files) {
      if (req.files.image) {
        if (video.image) {
          const oldImagePath = path.join(process.cwd(), video.image);
          await deleteFile(oldImagePath);
        }
        updateFields.image = `/uploads/${req.files.image[0].filename}`;
      }

      if (req.files.videoClip) {
        if (video.videoClip) {
          const oldVideoPath = path.join(process.cwd(), video.videoClip);
          await deleteFile(oldVideoPath);
        }
        updateFields.videoClip = `/uploads/${req.files.videoClip[0].filename}`;
      }
    }

    if (updateData.title) {
      updateFields.slug = updateData.title
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "");
    }

    const updatedVideo = await Videos.findByIdAndUpdate(
      VideoId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedVideo) {
      return next(errorHandler(404, "Video post not found"));
    }

    res.status(200).json({
      success: true,
      message: "Video post updated successfully",
      data: updatedVideo,
    });
  } catch (error) {
    console.error("Error in updating video:", error);
    next(error);
  }
};

const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const video = await Videos.findById(id);

    if (!video) {
      return next(errorHandler(404, "Video post not found"));
    }

    // Delete associated files
    if (video.image) {
      const imagePath = path.join(process.cwd(), video.image);
      await deleteFile(imagePath);
    }
    if (video.videoClip) {
      const videoPath = path.join(process.cwd(), video.videoClip);
      await deleteFile(videoPath);
    }

    await Videos.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Video post has been deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getAllVideos = async (req, res, next) => {
  try {
    const { category, startIndex = 0, limit = 9 } = req.query;

    // Build query object
    let query = {};
    if (category) {
      query.category = new RegExp(category, "i");
    }

    const videoClips = await Videos.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(startIndex))
      .limit(Number(limit));

    const totalVideos = await Videos.countDocuments(query);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthPosts = await Videos.countDocuments({
      ...query,
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      videos: videoClips,
      totalVideos,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

const getVideosBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const Video = await Videos.findOne({ slug });

    if (!Video) {
      return next(errorHandler(404, "No Video found"));
    }

    res.status(200).json(Video);
  } catch (error) {
    next(error);
  }
};

const getVideosById = async (req, res, next) => {
  try {
    const { VideoId } = req.params;

    if (!VideoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required",
      });
    }

    const Video = await Videos.findById(VideoId).select("-__v").lean();

    if (!Video) {
      return res.status(404).json({
        success: false,
        message: "No video found",
      });
    }

    const transformedVideo = {
      ...Video,
      image: Video.image ? `${Video.image}` : null,
      videoClip: Video.videoClip ? `${Video.videoClip}` : null,
    };

    res.status(200).json({
      success: true,
      data: transformedVideo,
    });
  } catch (error) {
    console.error("Error in getVideosById:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Video ID format",
      });
    }
    next(error);
  }
};

module.exports = {
  UploadVideo,
  getAllVideos,
  getVideosById,
  getVideosBySlug,
  updateVideo,
  deleteVideo,
};
