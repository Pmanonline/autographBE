// routes/IPVisitRoutes.js
const express = require("express");
const router = express.Router();
const {
  recordVisit,
  getVisitStatistics,
  getVisitorDetails,
} = require("../controllers/IPvisitsController");

// Middleware to validate IP address
const validateIP = (req, res, next) => {
  const ipAddress = req.params.ipAddress;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (
    !ipAddress ||
    (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress))
  ) {
    return res.status(400).json({ message: "Invalid IP address format" });
  }
  next();
};

router.post("/record", recordVisit);
router.get("/statistics", getVisitStatistics);
router.get("/visitor/:ipAddress", validateIP, getVisitorDetails);

module.exports = router;
