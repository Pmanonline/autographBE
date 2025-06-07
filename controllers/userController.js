const UserModel = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

dotenv.config();

const getAllProfiles = asyncHandler(async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
    const profile = await UserModel.findById(userId);

    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the image field contains only the filename
    if (profile.image) {
      profile.image = path.basename(profile.image);
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updateData = { ...req.body };

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle password update
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      // If no new password provided, remove password field to avoid overwriting
      delete updateData.password;
    }

    // Handle image update
    let oldImageFilename = user.image ? path.basename(user.image) : null;

    if (req.file) {
      updateData.image = req.file.filename;

      if (oldImageFilename) {
        const oldImageFilePath = path.join(
          __dirname,
          "../uploads",
          oldImageFilename
        );
        fs.unlink(oldImageFilePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error(`Failed to delete old image: ${err.message}`);
          }
        });
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password", // Exclude password from response
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found after update" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const deleteUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.image) {
      const filePath = path.join(
        __dirname,
        "../uploads",
        path.basename(user.image)
      );
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error(`Failed to delete user image: ${err.message}`);
        }
      });
    }

    await UserModel.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const getUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const startIndex = (page - 1) * limit;
    const sortDirection = req.query.sort === "asc" ? 1 : -1;

    const users = await UserModel.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const usersWithoutPassword = users.map(
      ({ _doc: { password, ...rest } }) => rest
    );

    const totalUsers = await UserModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthUsers = await UserModel.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      users: usersWithoutPassword,
      totalUsers,
      totalPages,
      lastMonthUsers,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = {
  getAllProfiles,
  getProfileById,
  updateProfile,
  deleteUserById,
  getUsers,
  getUserById,
};
