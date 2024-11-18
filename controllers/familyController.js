const fs = require("fs").promises;
const path = require("path");
const Family = require("../models/familyModel.js");
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

const createFamily = async (req, res, next) => {
  try {
    const { title, content, category, authorId, videoTag, videoContent } =
      req.body;

    const authorExists = await Author.findById(authorId);
    if (!authorExists) {
      return next(errorHandler(404, "Author not found"));
    }

    const existingPost = await Family.findOne({ title });
    if (existingPost) {
      return res.status(400).json({ message: "Post with same title exists" });
    }

    if (!req.files || !req.files.image1) {
      return next(errorHandler(400, "Image1 is required"));
    }

    // Check if there is already a post with the "topTrend" category
    if (category === "TopTrend") {
      const existingTopTrend = await Family.findOne({ category: "TopTrend" });
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

    const newFamily = new Family({
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
      postType: "Family",
    });

    const savedFamily = await newFamily.save();
    res.status(201).json(savedFamily);
  } catch (error) {
    console.error("Error in creating Family:", error);
    next(error);
  }
};

const getAllFamily = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Build query object
    let query = {};
    if (category) {
      // Make the category search case-insensitive
      query.category = new RegExp(category, "i");
    }

    const familyPosts = await Family.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name image bio");

    // Only count total posts and last month posts if no category filter
    let totalPosts = 0;
    let lastMonthPosts = 0;

    if (!category) {
      totalPosts = await Family.countDocuments();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      lastMonthPosts = await Family.countDocuments({
        createdAt: { $gte: oneMonthAgo },
      });
    } else {
      totalPosts = familyPosts.length;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      lastMonthPosts = familyPosts.filter(
        (post) => new Date(post.createdAt) >= oneMonthAgo
      ).length;
    }

    res.status(200).json({
      posts: familyPosts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

const getFamilyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const family = await Family.findOne({ slug }).populate(
      "authorId",
      "name image bio"
    );

    if (!family) {
      return next(errorHandler(404, "Family post not found"));
    }

    res.status(200).json(family);
  } catch (error) {
    next(error);
  }
};

const getFamilyById = async (req, res, next) => {
  try {
    const { familyId } = req.params;

    if (!familyId) {
      return res.status(400).json({
        success: false,
        message: "Family ID is required",
      });
    }

    const family = await Family.findById(familyId)
      .populate("authorId", "name image bio")
      .select("-__v")
      .lean();

    if (!family) {
      return res.status(404).json({
        success: false,
        message: "Family post not found",
      });
    }

    const transformedFamily = {
      ...family,
      image1: family.image1 ? `${family.image1}` : null,
      image2: family.image2 ? `${family.image2}` : null,
      videoClip: family.videoClip ? `${family.videoClip}` : null,
      author: family.authorId,
      authorId: family.authorId._id,
    };

    res.status(200).json({
      success: true,
      data: transformedFamily,
    });
  } catch (error) {
    console.error("Error in getFamilyById:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid family ID format",
      });
    }
    next(error);
  }
};

const updateFamily = async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const updateData = req.body;

    console.log("Updating family with ID:", familyId);
    console.log("Update data:", updateData);
    console.log("Files:", req.files);

    let family = await Family.findById(familyId);

    if (!family) {
      console.log("Family post not found");
      return next(errorHandler(404, "Family post not found"));
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
        if (family.image1) {
          const oldImagePath = path.join(process.cwd(), family.image1);
          await deleteFile(oldImagePath);
        }
        updateFields.image1 = `/uploads/${req.files.image1[0].filename}`;
      }
      if (req.files.image2) {
        if (family.image2) {
          const oldImagePath = path.join(process.cwd(), family.image2);
          await deleteFile(oldImagePath);
        }
        updateFields.image2 = `/uploads/${req.files.image2[0].filename}`;
      }
      if (req.files.videoClip) {
        if (family.videoClip) {
          const oldVideoPath = path.join(process.cwd(), family.videoClip);
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

    const updatedFamily = await Family.findByIdAndUpdate(
      familyId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("authorId", "name image bio");

    if (!updatedFamily) {
      return next(errorHandler(404, "Family post not found"));
    }

    res.status(200).json({
      success: true,
      message: "Family post updated successfully",
      data: updatedFamily,
    });
  } catch (error) {
    console.error("Error in updateFamily:", error);
    next(error);
  }
};

const deleteFamily = async (req, res, next) => {
  try {
    const { id } = req.params;
    const family = await Family.findById(id);

    if (!family) {
      return next(errorHandler(404, "Family post not found"));
    }

    // Delete associated files
    if (family.image1) {
      const image1Path = path.join(process.cwd(), family.image1);
      await deleteFile(image1Path);
    }
    if (family.image2) {
      const image2Path = path.join(process.cwd(), family.image2);
      await deleteFile(image2Path);
    }
    if (family.videoClip) {
      const videoPath = path.join(process.cwd(), family.videoClip);
      await deleteFile(videoPath);
    }

    await Family.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Family post has been deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFamily,
  getAllFamily,
  getFamilyById,
  getFamilyBySlug,
  updateFamily,
  deleteFamily,
};
