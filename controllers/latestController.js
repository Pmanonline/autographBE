const fs = require("fs").promises;
const path = require("path");
const Latest = require("../models/LatestModel.js");
const Author = require("../models/authorModel.js");
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

const createLatest = async (req, res, next) => {
  try {
    const { title, content, category, authorId, videoTag, videoContent } =
      req.body;

    const authorExists = await Author.findById(authorId);
    if (!authorExists) {
      return next(errorHandler(404, "Author not found"));
    }

    const existingPost = await Latest.findOne({ title });
    if (existingPost) {
      return res.status(400).json({ message: "Post with same title exists" });
    }

    if (!req.files || !req.files.image1) {
      return next(errorHandler(400, "Image1 is required"));
    }

    // Check if there is already a post with the "topTrend" category
    if (category === "TopTrend") {
      const existingTopTrend = await Latest.findOne({ category: "TopTrend" });
      if (existingTopTrend) {
        return res
          .status(400)
          .json({ message: "Only one 'topTrend' post is allowed" });
      }
    }

    const imageUrl1 = `/uploads/${req.files.image1[0].filename}`;
    const imageUrl2 = req.files.image2
      ? `/uploads/${req.files.image2[0].filename}`
      : null;
    const videoClipUrl = req.files.videoClip
      ? `/uploads/${req.files.videoClip[0].filename}`
      : null;

    const slug = title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const newLatest = new Latest({
      title,
      content,
      category,
      slug,
      videoTag,
      videoContent,
      image1: imageUrl1,
      image2: imageUrl2,
      videoClip: videoClipUrl,
      authorId,
      postType: "Latest",
    });

    const savedLatest = await newLatest.save();
    res.status(201).json(savedLatest);
  } catch (error) {
    console.error("Error in creating Latest:", error);
    next(error);
  }
};

const getAllLatest = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Build query object
    let query = {};
    if (category) {
      // Make the category search case-insensitive
      query.category = new RegExp(category, "i");
    }

    const latestPosts = await Latest.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name image bio");

    // Only count total posts and last month posts if no category filter
    let totalPosts = 0;
    let lastMonthPosts = 0;

    if (!category) {
      totalPosts = await Latest.countDocuments();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      lastMonthPosts = await Latest.countDocuments({
        createdAt: { $gte: oneMonthAgo },
      });
    } else {
      totalPosts = latestPosts.length;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      lastMonthPosts = latestPosts.filter(
        (post) => new Date(post.createdAt) >= oneMonthAgo
      ).length;
    }

    res.status(200).json({
      posts: latestPosts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

const getLatestBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const latest = await Latest.findOne({ slug }).populate(
      "authorId",
      "name image bio"
    );

    if (!latest) {
      return next(errorHandler(404, "Latest post not found"));
    }

    res.status(200).json(latest);
  } catch (error) {
    next(error);
  }
};

const getLatestById = async (req, res, next) => {
  try {
    const { latestId } = req.params;

    if (!latestId) {
      return res.status(400).json({
        success: false,
        message: "Latest ID is required",
      });
    }

    const latest = await Latest.findById(latestId)
      .populate("authorId", "name image bio")
      .select("-__v")
      .lean();

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "Latest post not found",
      });
    }

    const transformedLatest = {
      ...latest,
      image1: latest.image1 ? `${latest.image1}` : null,
      image2: latest.image2 ? `${latest.image2}` : null,
      videoClip: latest.videoClip ? `${latest.videoClip}` : null,
      author: latest.authorId,
      authorId: latest.authorId._id,
    };

    res.status(200).json({
      success: true,
      data: transformedLatest,
    });
  } catch (error) {
    console.error("Error in getLatestById:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid latest ID format",
      });
    }
    next(error);
  }
};

const updateLatest = async (req, res, next) => {
  try {
    const { latestId } = req.params;
    const updateData = req.body;

    console.log("Updating latest with ID:", latestId);
    console.log("Update data:", updateData);
    console.log("Files:", req.files);

    let latest = await Latest.findById(latestId);

    if (!latest) {
      console.log("Latest post not found");
      return next(errorHandler(404, "Latest post not found"));
    }

    const updateFields = {};

    [
      "title",
      "content",
      "category",
      "authorId",
      "videoTag",
      "videoContent",
    ].forEach((field) => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        updateFields[field] = updateData[field];
      }
    });

    if (req.files) {
      if (req.files.image1) {
        if (latest.image1) {
          const oldImagePath = path.join(process.cwd(), latest.image1);
          await deleteFile(oldImagePath);
        }
        updateFields.image1 = `/uploads/${req.files.image1[0].filename}`;
      }
      if (req.files.image2) {
        if (latest.image2) {
          const oldImagePath = path.join(process.cwd(), latest.image2);
          await deleteFile(oldImagePath);
        }
        updateFields.image2 = `/uploads/${req.files.image2[0].filename}`;
      }
      if (req.files.videoClip) {
        if (latest.videoClip) {
          const oldVideoPath = path.join(process.cwd(), latest.videoClip);
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

    console.log("Final update fields:", updateFields);

    const updatedLatest = await Latest.findByIdAndUpdate(
      latestId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("authorId", "name image bio");

    if (!updatedLatest) {
      return next(errorHandler(404, "Latest post not found"));
    }

    res.status(200).json({
      success: true,
      message: "Latest post updated successfully",
      data: updatedLatest,
    });
  } catch (error) {
    console.error("Error in updateLatest:", error);
    next(error);
  }
};

const deleteLatest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const latest = await Latest.findById(id);

    if (!latest) {
      return next(errorHandler(404, "Latest post not found"));
    }

    // Delete associated files
    if (latest.image1) {
      const image1Path = path.join(process.cwd(), latest.image1);
      await deleteFile(image1Path);
    }
    if (latest.image2) {
      const image2Path = path.join(process.cwd(), latest.image2);
      await deleteFile(image2Path);
    }
    if (latest.videoClip) {
      const videoPath = path.join(process.cwd(), latest.videoClip);
      await deleteFile(videoPath);
    }

    await Latest.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Latest post has been deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLatest,
  getAllLatest,
  getLatestById,
  getLatestBySlug,
  updateLatest,
  deleteLatest,
};
