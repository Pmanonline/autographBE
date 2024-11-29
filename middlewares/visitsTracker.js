// middleware/visitTracker.js
const IPVisitController = require("../controllers/IPvisitsController");

const visitTrackerMiddleware = async (req, res, next) => {
  // Skip tracking for certain routes if needed
  const excludedPaths = ["/health", "/metrics", "/favicon.ico"];
  if (excludedPaths.includes(req.path)) {
    return next();
  }

  try {
    // Create a copy of the original end function
    const originalEnd = res.end;

    // Override the end function
    res.end = async function (chunk, encoding) {
      // Restore the original end function
      res.end = originalEnd;

      // Only track successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Create a mock response object to capture the controller response
          const mockRes = {
            status: () => ({ json: () => {} }),
          };

          // Record the visit asynchronously
          await IPVisitController.recordVisit(req, mockRes);
        } catch (error) {
          console.error("Error in visit tracker middleware:", error);
        }
      }

      // Call the original end function
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  } catch (error) {
    console.error("Error in visit tracker middleware:", error);
    next();
  }
};

module.exports = visitTrackerMiddleware;
