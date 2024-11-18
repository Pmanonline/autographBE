const fs = require("fs").promises;
const path = require("path");
const News = require("../models/newsModel.js");
const { errorHandler } = require("../middlewares/errorHandling.js");
const NewsletterSubscription = require("../models/NewsLetterModel.js");

// Utility function to delete a file
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted ${filePath}`);
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error);
  }
};

const createNews = async (req, res, next) => {
  try {
    const { title, url, date } = req.body;

    const existingPost = await News.findOne({ title });
    if (existingPost) {
      return res.status(400).json({ message: "Post with same title exists" });
    }

    if (!req.file) {
      return next(errorHandler(400, "Image is required"));
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const slug = title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const newNews = new News({
      title,
      url,
      date: new Date(date),
      image: imageUrl,
      slug,
    });

    const savedNews = await newNews.save();
    res.status(201).json(savedNews);
  } catch (error) {
    console.error("Error in creating News:", error);
    next(error);
  }
};

const getAllNews = async (req, res, next) => {
  try {
    const NewsPosts = await News.find().sort({ date: -1 });

    const totalPosts = await News.countDocuments();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthPosts = await News.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      posts: NewsPosts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

const getNewsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const News = await News.findOne({ slug });

    if (!News) {
      return next(errorHandler(404, "News post not found"));
    }

    res.status(200).json(News);
  } catch (error) {
    next(error);
  }
};

const getNewsById = async (req, res, next) => {
  try {
    const { NewsId } = req.params;

    // Use a different variable name for the fetched news data
    const newsPost = await News.findById(NewsId).select("-__v").lean();

    if (!NewsId) {
      return res.status(400).json({
        success: false,
        message: "News ID is required",
      });
    }

    if (!newsPost) {
      return res.status(404).json({
        success: false,
        message: "News post not found",
      });
    }

    const transformedNews = {
      ...newsPost,
      image: newsPost.image ? `${newsPost.image}` : null,
    };

    res.status(200).json({
      success: true,
      data: transformedNews,
    });
  } catch (error) {
    console.error("Error in getNewsById:", error);
    next(error);
  }
};

const updateNews = async (req, res, next) => {
  try {
    const { NewsId } = req.params;
    const updateData = req.body;

    let newsPost = await News.findById(NewsId); // Rename variable to avoid shadowing

    if (!newsPost) {
      return next(errorHandler(404, "News post not found"));
    }

    const updateFields = {};

    // Update only specified fields
    ["title", "url", "date"].forEach((field) => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        updateFields[field] =
          field === "date" ? new Date(updateData[field]) : updateData[field];
      }
    });

    // Handle image update
    if (req.file) {
      if (newsPost.image) {
        const oldImagePath = path.join(process.cwd(), newsPost.image);
        try {
          await deleteFile(oldImagePath);
        } catch (error) {
          console.error("Error deleting old image:", error);
          return next(errorHandler(500, "Failed to delete old image"));
        }
      }
      updateFields.image = `/uploads/${req.file.filename}`;
    }

    // Update slug if the title has changed
    if (updateData.title) {
      updateFields.slug = updateData.title
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "");
    }

    // Update the News post
    const updatedNews = await News.findByIdAndUpdate(
      NewsId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedNews) {
      return next(errorHandler(404, "News post not found"));
    }

    res.status(200).json({
      success: true,
      message: "News post updated successfully",
      data: updatedNews,
    });
  } catch (error) {
    console.error("Error in updateNews:", error);
    next(error);
  }
};

const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsPost = await News.findById(id); // Rename variable to avoid shadowing

    if (!newsPost) {
      return next(errorHandler(404, "News post not found"));
    }

    // Check if there is an image and attempt to delete it
    if (newsPost.image) {
      const imagePath = path.join(process.cwd(), newsPost.image);
      try {
        await deleteFile(imagePath);
      } catch (error) {
        console.error("Error deleting image:", error);
        return next(errorHandler(500, "Failed to delete image"));
      }
    }

    // Delete the news post
    await News.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "News post has been deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNews:", error);
    next(error);
  }
};
const NewLetterSubscribe = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const subscription = new NewsletterSubscription({ email });
    await subscription.save();
    res.status(201).json({ message: "Subscription successful!" });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate email
      return res.status(409).json({ message: "Email already subscribed." });
    }
    console.error(error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
};

const getNewsletterSubscribers = async (req, res) => {
  try {
    const today = new Date();

    // Get start dates for different periods
    const weekStart = moment().subtract(7, "days").toDate();
    const monthStart = moment().subtract(30, "days").toDate();
    const prevMonthStart = moment().subtract(60, "days").toDate();

    // Get total subscribers
    const totalSubscribers = await NewsletterSubscription.countDocuments();

    // Get weekly subscribers
    const weeklySubscribers = await NewsletterSubscription.countDocuments({
      createdAt: { $gte: weekStart },
    });

    // Get current month subscribers
    const monthlySubscribers = await NewsletterSubscription.countDocuments({
      createdAt: { $gte: monthStart },
    });

    // Get previous month subscribers for comparison
    const prevMonthSubscribers = await NewsletterSubscription.countDocuments({
      createdAt: {
        $gte: prevMonthStart,
        $lt: monthStart,
      },
    });

    // Get weekly breakdown
    const weeklyBreakdown = await NewsletterSubscription.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get monthly breakdown
    const monthlyBreakdown = await NewsletterSubscription.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        weeklySubscribers,
        monthlySubscribers,
        prevMonthSubscribers,
        weeklyBreakdown,
        monthlyBreakdown,
        growthRate: {
          monthly: (
            ((monthlySubscribers - prevMonthSubscribers) /
              prevMonthSubscribers) *
            100
          ).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subscriber data",
      error: error.message,
    });
  }
};

module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  getNewsBySlug,
  updateNews,
  deleteNews,
  getNewsletterSubscribers,
  NewLetterSubscribe,
};
