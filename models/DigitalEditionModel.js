const mongoose = require("mongoose");

const digitalEditionShema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },

    image1: {
      type: String,
    },
    image2: {
      type: [String], // Change to an array of strings
      default: [], // Default to an empty array
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },
    likes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DigitalEdition", digitalEditionShema);
