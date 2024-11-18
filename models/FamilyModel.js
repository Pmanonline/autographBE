const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    videoTag: {
      type: String,
    },
    videoContent: {
      type: String,
    },
    image1: {
      type: String,
    },
    image2: {
      type: String,
    },
    videoClip: {
      type: String,
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
    postType: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Family", familySchema);
