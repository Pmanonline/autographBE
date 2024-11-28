const fs = require("fs").promises;
const path = require("path");
const DigitalEdition = require("../models/DigitalEditionModel.js");
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

const createDigitalEdition = async (req, res, next) => {
  try {
    const { title, category, authorId } = req.body;

    const authorExists = await Author.findById(authorId);
    if (!authorExists) {
      return next(errorHandler(404, "Author not found"));
    }

    const existingEdition = await DigitalEdition.findOne({ title });
    if (existingEdition) {
      return res
        .status(400)
        .json({ message: "Digital edition with the same title exists" });
    }

    if (!req.files || !req.files.image1) {
      return next(errorHandler(400, "Cover image is required"));
    }

    const pdfFiles = req.files.image2
      ? req.files.image2.map((file) => `/uploads/${file.filename}`)
      : [];

    const slug = title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const newDigitalEdition = new DigitalEdition({
      title,
      category,
      slug,
      authorId,
      image1: `/uploads/${req.files.image1[0].filename}`,
      image2: pdfFiles,
    });

    const savedDigitalEdition = await newDigitalEdition.save();
    res.status(201).json(savedDigitalEdition);
  } catch (error) {
    console.error("Error in creating Digital Edition:", error);
    next(error);
  }
};

const getAllDigitalEditions = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Build query object
    let query = {};
    if (category) {
      query.category = new RegExp(category, "i");
    }

    const digitalEditions = await DigitalEdition.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name image bio");

    res.status(200).json(digitalEditions);
  } catch (error) {
    next(error);
  }
};
const getDigitalEditionsCount = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Build query object
    let query = {};
    if (category) {
      query.category = new RegExp(category, "i");
    }

    const count = await DigitalEdition.countDocuments(query);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

// Get paginated digital editions
const getAllDigitalEditions2 = async (req, res, next) => {
  try {
    const { category, startIndex = 0, limit = 9 } = req.query;
    const pageSize = parseInt(limit);
    const skip = parseInt(startIndex);

    // Build query object
    let query = {};
    if (category) {
      query.category = new RegExp(category, "i");
    }

    // Get total count for the query
    const totalCount = await DigitalEdition.countDocuments(query);

    // Get paginated results
    const digitalEditions = await DigitalEdition.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name image bio")
      .skip(skip)
      .limit(pageSize);

    // Send response with pagination metadata
    res.status(200).json({
      digitalEditions,
      pagination: {
        total: totalCount,
        pageSize,
        currentPage: Math.floor(skip / pageSize) + 1,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDigitalEditionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const digitalEdition = await DigitalEdition.findOne({ slug }).populate(
      "authorId",
      "name image bio"
    );

    if (!digitalEdition) {
      return next(errorHandler(404, "Digital edition not found"));
    }

    res.status(200).json(digitalEdition);
  } catch (error) {
    next(error);
  }
};

const getDigitalEditionById = async (req, res, next) => {
  try {
    const { digitalEditionId } = req.params;

    if (!digitalEditionId) {
      return res.status(400).json({
        success: false,
        message: "Digital Edition ID is required",
      });
    }

    const digitalEdition = await DigitalEdition.findById(digitalEditionId)
      .populate("authorId", "name image bio")
      .select("-__v")
      .lean();

    if (!digitalEdition) {
      return res.status(404).json({
        success: false,
        message: "Digital edition not found",
      });
    }

    res.status(200).json({
      success: true,
      data: digitalEdition,
    });
  } catch (error) {
    console.error("Error in getDigitalEditionById:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Digital Edition ID format",
      });
    }
    next(error);
  }
};

const updateDigitalEdition = async (req, res, next) => {
  try {
    const { digitalEditionId } = req.params;
    const updateData = req.body;

    let digitalEdition = await DigitalEdition.findById(digitalEditionId);

    if (!digitalEdition) {
      return next(errorHandler(404, "Digital edition not found"));
    }

    const updateFields = {};

    ["title", "category", "authorId"].forEach((field) => {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        updateFields[field] = updateData[field];
      }
    });

    if (req.files) {
      if (req.files.image1) {
        if (digitalEdition.image1) {
          const oldPdfPath = path.join(process.cwd(), digitalEdition.image1);
          await deleteFile(oldPdfPath);
        }
        updateFields.image1 = `/uploads/${req.files.image1[0].filename}`;
      }
      if (req.files.image2) {
        if (digitalEdition.image2) {
          digitalEdition.image2.forEach(async (filePath) => {
            const oldPdfPath = path.join(process.cwd(), filePath);
            await deleteFile(oldPdfPath);
          });
        }
        updateFields.image2 = req.files.image2.map(
          (file) => `/uploads/${file.filename}`
        );
      }
    }

    if (updateData.title) {
      updateFields.slug = updateData.title
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "");
    }

    const updatedDigitalEdition = await DigitalEdition.findByIdAndUpdate(
      digitalEditionId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("authorId", "name image bio");

    if (!updatedDigitalEdition) {
      return next(errorHandler(404, "Digital edition not found"));
    }

    res.status(200).json({
      success: true,
      message: "Digital edition updated successfully",
      data: updatedDigitalEdition,
    });
  } catch (error) {
    console.error("Error in updateDigitalEdition:", error);
    next(error);
  }
};

const deleteDigitalEdition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const digitalEdition = await DigitalEdition.findById(id);

    if (!digitalEdition) {
      return next(errorHandler(404, "Digital edition not found"));
    }

    // Delete associated files
    if (digitalEdition.image1) {
      const pdf1Path = path.join(process.cwd(), digitalEdition.image1);
      await deleteFile(pdf1Path);
    }
    if (digitalEdition.image2) {
      digitalEdition.image2.forEach(async (filePath) => {
        const pdfPath = path.join(process.cwd(), filePath);
        await deleteFile(pdfPath);
      });
    }

    await DigitalEdition.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Digital edition has been deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDigitalEdition,
  getAllDigitalEditions,
  getAllDigitalEditions2,
  getDigitalEditionsCount,
  getDigitalEditionById,
  getDigitalEditionBySlug,
  updateDigitalEdition,
  deleteDigitalEdition,
};
