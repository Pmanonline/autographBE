const fs = require("fs").promises;
const path = require("path");
const Fashion = require("../models/fashionModel.js");
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

const createFashion = async (req, res, next) => {
  try {
    const {
      title,
      content,
      postType,
      category,
      subCategory,
      authorId,
      videoTag,
      videoContent,
    } = req.body;

    // Validate author
    const authorExists = await Author.findById(authorId);
    if (!authorExists) {
      return next(errorHandler(404, "Author not found"));
    }

    // Check for duplicate title
    const existingPost = await Fashion.findOne({ title });
    if (existingPost) {
      return res.status(400).json({ message: "Post with same title exists" });
    }

    // Validate required image
    if (!req.files || !req.files.image1) {
      return next(errorHandler(400, "Image1 is required"));
    }

    // Handle TopTrend validation based on postType and subcategory
    if (category === "TopTrend") {
      let topTrendExists;

      if (postType === "LifeStyle" && subCategory) {
        // For LifeStyle, check TopTrend within the same subcategory
        topTrendExists = await Fashion.findOne({
          postType: "LifeStyle",
          category: "TopTrend",
          subCategory: subCategory,
        });

        if (topTrendExists) {
          return res.status(400).json({
            message: `Only one TopTrend post is allowed for LifeStyle subcategory: ${subCategory}`,
          });
        }
      } else {
        // For other postTypes, check TopTrend within the same postType
        topTrendExists = await Fashion.findOne({
          postType: postType,
          category: "TopTrend",
        });

        if (topTrendExists) {
          return res.status(400).json({
            message: `Only one TopTrend post is allowed for postType: ${postType}`,
          });
        }
      }
    }

    // Process image and video uploads
    const imageUrl1 = `/uploads/${req.files.image1[0].filename}`;
    const imageUrl2 = req.files.image2
      ? req.files.image2.map((file) => `/uploads/${file.filename}`)
      : [];
    const videoClipUrl = req.files.videoClip
      ? `/uploads/${req.files.videoClip[0].filename}`
      : null;

    // Generate slug
    const slug = title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    // Create new fashion post
    const newFashion = new Fashion({
      title,
      content,
      category,
      subCategory,
      slug,
      videoTag,
      videoContent,
      image1: imageUrl1,
      image2: imageUrl2,
      videoClip: videoClipUrl,
      authorId,
      postType,
    });

    const savedFashion = await newFashion.save();
    res.status(201).json(savedFashion);
  } catch (error) {
    console.error("Error in creating Fashion:", error);
    next(error);
  }
};

const getAllFashion = async (req, res, next) => {
  try {
    const { category, postType, subCategory, startIndex, limit } = req.query;
    const pageSize = parseInt(limit) || 9;
    const skip = parseInt(startIndex) || 0;

    // Build query object
    let query = {};
    if (category) {
      query.category = new RegExp(category, "i");
    }
    if (postType && postType !== "All") {
      query.postType = postType;
    }
    if (subCategory) {
      query.subCategory = new RegExp(subCategory, "i");
    }

    // Get total count before applying pagination
    const totalPosts = await Fashion.countDocuments(query);

    // Apply pagination to the query
    const fashionPosts = await Fashion.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name image bio")
      .skip(skip)
      .limit(pageSize);

    // Calculate last month's posts
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthPosts = await Fashion.countDocuments({
      ...query,
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      posts: fashionPosts,
      total: totalPosts,
      lastMonthPosts,
      currentPage: Math.floor(skip / pageSize) + 1,
      totalPages: Math.ceil(totalPosts / pageSize),
    });
  } catch (error) {
    next(error);
  }
};

const getFashionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const fashion = await Fashion.findOne({ slug }).populate(
      "authorId",
      "name image bio"
    );

    if (!fashion) {
      return next(errorHandler(404, "Fashion post not found"));
    }

    res.status(200).json(fashion);
  } catch (error) {
    next(error);
  }
};

const getFashionById = async (req, res, next) => {
  try {
    const { fashionId } = req.params;

    if (!fashionId) {
      return res.status(400).json({
        success: false,
        message: "Fashion ID is required",
      });
    }

    const fashion = await Fashion.findById(fashionId)
      .populate("authorId", "name image bio")
      .select("-__v")
      .lean();

    if (!fashion) {
      return res.status(404).json({
        success: false,
        message: "Fashion post not found",
      });
    }

    const transformedFashion = {
      ...fashion,
      image1: fashion.image1 ? `${fashion.image1}` : null,
      image2: fashion.image2 ? `${fashion.image2}` : null,
      videoClip: fashion.videoClip ? `${fashion.videoClip}` : null,
      author: fashion.authorId,
      authorId: fashion.authorId._id,
    };

    res.status(200).json({
      success: true,
      data: transformedFashion,
    });
  } catch (error) {
    console.error("Error in getFashionById:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid fashion ID format",
      });
    }
    next(error);
  }
};

const updateFashion = async (req, res, next) => {
  try {
    const { fashionId } = req.params;
    const updateData = req.body;

    console.log("Updating fashion with ID:", fashionId);
    console.log("Update data:", updateData);
    console.log("Files:", req.files);

    let fashion = await Fashion.findById(fashionId);

    if (!fashion) {
      console.log("Fashion post not found");
      return next(errorHandler(404, "Fashion post not found"));
    }

    const updateFields = {};

    [
      "title",
      "content",
      "category",
      "subCategory",
      "postType",
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
        if (fashion.image1) {
          const oldImagePath = path.join(process.cwd(), fashion.image1);
          await deleteFile(oldImagePath);
        }
        updateFields.image1 = `/uploads/${req.files.image1[0].filename}`;
      }

      if (req.files.image2) {
        // Delete old images if they exist
        if (fashion.image2 && fashion.image2.length > 0) {
          for (const imagePath of fashion.image2) {
            const oldImagePath = path.join(process.cwd(), imagePath);
            await deleteFile(oldImagePath);
          }
        }

        // Add new images
        updateFields.image2 = req.files.image2.map(
          (file) => `/uploads/${file.filename}`
        );
      }
      if (req.files.videoClip) {
        if (fashion.videoClip) {
          const oldVideoPath = path.join(process.cwd(), fashion.videoClip);
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

    const updatedFashion = await Fashion.findByIdAndUpdate(
      fashionId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("authorId", "name image bio");

    if (!updatedFashion) {
      return next(errorHandler(404, "Fashion post not found"));
    }

    res.status(200).json({
      success: true,
      message: "Fashion post updated successfully",
      data: updatedFashion,
    });
  } catch (error) {
    console.error("Error in updateFashion:", error);
    next(error);
  }
};

const deleteFashion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fashion = await Fashion.findById(id);

    if (!fashion) {
      return next(errorHandler(404, "Fashion post not found"));
    }

    // Delete associated files
    if (fashion.image1) {
      const image1Path = path.join(process.cwd(), fashion.image1);
      await deleteFile(image1Path);
    }
    if (fashion.image2 && fashion.image2.length > 0) {
      for (const imagePath of fashion.image2) {
        const image2Path = path.join(process.cwd(), imagePath);
        await deleteFile(image2Path);
      }
    }
    if (fashion.videoClip) {
      const videoPath = path.join(process.cwd(), fashion.videoClip);
      await deleteFile(videoPath);
    }

    await Fashion.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Fashion post has been deleted successfully" });
  } catch (error) {
    next(error);
  }
};
const uploadQuillImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: imageUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFashion,
  getAllFashion,
  getFashionById,
  getFashionBySlug,
  updateFashion,
  deleteFashion,
  uploadQuillImage,
};
