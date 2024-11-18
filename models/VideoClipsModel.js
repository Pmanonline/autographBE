const mongoose = require("mongoose");

const VideoClipsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
    },

    image: {
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
    postType: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Videos", VideoClipsSchema);
