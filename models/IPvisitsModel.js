// models/IPVisitModel.js
const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
    index: true, // Add index for better query performance
  },
  totalVisits: {
    type: Number,
    default: 1,
    min: 1, // Ensure count never goes below 1
  },
  lastVisit: {
    type: Date,
    default: Date.now,
  },
  firstVisit: {
    type: Date,
    default: Date.now,
    immutable: true, // Can't be modified after creation
  },
  userAgent: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
  visits: [
    {
      timestamp: Date,
      userAgent: String,
    },
  ],
});

// Add a method to the schema to check if the visitor is considered active
visitSchema.methods.isActive = function (hoursThreshold = 24) {
  const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  return this.lastVisit >= threshold;
};

const VisitModel = mongoose.model("IP_Visit", visitSchema);
module.exports = VisitModel;
