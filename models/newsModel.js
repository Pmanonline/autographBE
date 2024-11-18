const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
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

module.exports = mongoose.model("NEWS", NewsSchema);
