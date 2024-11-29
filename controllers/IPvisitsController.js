// controllers/IPVisitController.js
const VisitModel = require("../models/IPvisitsModel");

const recordVisit = async (req, res) => {
  const ipAddress = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const existingVisitor = await VisitModel.findOne({ ipAddress });
    const isNewVisitor = !existingVisitor;

    // Using findOneAndUpdate for atomic operations
    const visit = await VisitModel.findOneAndUpdate(
      { ipAddress },
      {
        $inc: { totalVisits: 1 },
        $set: {
          lastVisit: Date.now(),
          userAgent,
          isUnique: isNewVisitor,
        },
        $push: {
          visits: {
            timestamp: Date.now(),
            userAgent,
          },
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      message: "Visit recorded successfully",
      visitData: {
        totalVisits: visit.totalVisits,
        firstVisit: visit.firstVisit,
        isNewVisitor,
        isReturningVisitor: visit.totalVisits > 1,
      },
    });
  } catch (error) {
    console.error("Error recording visit:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getVisitStatistics = async (req, res) => {
  const timeRange = req.query.range || "24h"; // Default to 24 hours
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "week":
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 24 * 60 * 60 * 1000);
  }

  try {
    const [totalStats, periodStats, hourlyStats] = await Promise.all([
      // Overall statistics
      VisitModel.aggregate([
        {
          $group: {
            _id: null,
            totalUniqueVisitors: { $sum: 1 },
            totalVisits: { $sum: "$totalVisits" },
          },
        },
      ]),

      // Period-specific statistics
      VisitModel.aggregate([
        {
          $facet: {
            uniqueVisitors: [
              { $match: { firstVisit: { $gte: startDate } } },
              { $count: "count" },
            ],
            returningVisitors: [
              {
                $match: {
                  totalVisits: { $gt: 1 },
                  lastVisit: { $gte: startDate },
                },
              },
              { $count: "count" },
            ],
            activeVisitors: [
              { $match: { lastVisit: { $gte: startDate } } },
              { $count: "count" },
            ],
          },
        },
      ]),

      // Hourly distribution
      VisitModel.aggregate([
        {
          $match: { lastVisit: { $gte: startDate } },
        },
        {
          $group: {
            _id: { $hour: "$lastVisit" },
            visits: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const stats = {
      totalUniqueVisitors: totalStats[0]?.totalUniqueVisitors || 0,
      totalVisits: totalStats[0]?.totalVisits || 0,
      periodStats: {
        uniqueVisitors: periodStats[0]?.uniqueVisitors[0]?.count || 0,
        returningVisitors: periodStats[0]?.returningVisitors[0]?.count || 0,
        activeVisitors: periodStats[0]?.activeVisitors[0]?.count || 0,
      },
      hourlyDistribution: hourlyStats.map((hour) => ({
        hour: hour._id,
        visits: hour.visits,
        timestamp: new Date().setHours(hour._id, 0, 0, 0),
      })),
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching visit statistics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getVisitorDetails = async (req, res) => {
  const { ipAddress } = req.params;

  try {
    const visitor = await VisitModel.findOne({ ipAddress });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.status(200).json({
      ipAddress: visitor.ipAddress,
      totalVisits: visitor.totalVisits,
      firstVisit: visitor.firstVisit,
      lastVisit: visitor.lastVisit,
      isActive: visitor.isActive(),
      visitHistory: visitor.visits,
    });
  } catch (error) {
    console.error("Error fetching visitor details:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  recordVisit,
  getVisitStatistics,
  getVisitorDetails,
};
