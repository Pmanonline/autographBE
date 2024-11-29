// const express = require("express");
// const path = require("path");
// const app = express();
// const bodyParser = require("body-parser");
// const session = require("express-session");
// const cookieParser = require("cookie-parser");
// const morgan = require("morgan");
// const cors = require("cors");
// const multer = require("multer");
// const dotenv = require("dotenv");
// const jwt = require("jsonwebtoken");
// const connectDB = require("./config/db.config");
// const { errorHandlingMiddleware } = require("./middlewares/errorHandling.js");
// const Routes = require("./routes/route.js");
// const fashionRoutes = require("./routes/fashoinRoute.js");
// const VideoRoutes = require("./routes/videoRoutes.js");
// const DigitalEditionRoutes = require("./routes/DigitalEditionRoutes.js");
// const latestRoutes = require("./routes/latestRoutes.js");
// const newRoutes = require("./routes/NewsRoutes.js");
// const commentRoutes = require("./routes/commentRoute.js");

// // outdated
// const UserRoutes = require("./routes/userRoutes.js");
// const PostsRoutes = require("./routes/postRoutes.js");
// const authorRoutes = require("./routes/authorRoutes.js");

// // outdated

// dotenv.config();
// connectDB();

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "your_session_secret",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     },
//   })
// );

// // Middleware

// app.use(express.json({ limit: "50mb" }));
// app.use(morgan("dev"));
// app.use(cookieParser());
// app.use(bodyParser.json({ limit: "50mb" }));
// app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
// app.use(errorHandlingMiddleware);

// const corsOptions = {
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
// app.options("*", cors());

// app.use(errorHandlingMiddleware);
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "your_session_secret",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     },
//   })
// );

// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "strict",
// };

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/insertImage", express.static(path.join(__dirname, "insertImage")));
// app.use(express.static(path.join(__dirname, "public")));

// app.use("/api", Routes);
// app.use("/api", fashionRoutes);
// app.use("/api", VideoRoutes);
// app.use("/api", DigitalEditionRoutes);
// app.use("/api", latestRoutes);
// app.use("/api", newRoutes);
// app.use("/api", commentRoutes);

// // outdated
// app.use("/api", UserRoutes);
// app.use("/api", PostsRoutes);
// app.use("/api", authorRoutes);

// // testing
// app.get("/", (req, res) => {
//   res.json("This API is available!!");
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// // Export the app for Vercel
// module.exports = app;

const express = require("express");
const path = require("path");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db.config");
const { errorHandlingMiddleware } = require("./middlewares/errorHandling.js");
const visitTrackerMiddleware = require("./middlewares/visitsTracker.js");

// Route imports
const Routes = require("./routes/route.js");
const fashionRoutes = require("./routes/fashoinRoute.js");
const VideoRoutes = require("./routes/videoRoutes.js");
const DigitalEditionRoutes = require("./routes/DigitalEditionRoutes.js");
const latestRoutes = require("./routes/latestRoutes.js");
const newRoutes = require("./routes/NewsRoutes.js");
const commentRoutes = require("./routes/commentRoute.js");
const UserRoutes = require("./routes/userRoutes.js");
const PostsRoutes = require("./routes/postRoutes.js");
const authorRoutes = require("./routes/authorRoutes.js");
const visitRoutes = require("./routes/IPvisitsRoutes.js");

const app = express();

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Add the middleware before your routes
app.use(visitTrackerMiddleware);

// CORS Configuration
const corsOptions = {
  origin: ["*", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(morgan("dev"));

// 2. Basic middleware
app.use(cors(corsOptions));
app.options("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// 3. Session middleware (only once)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  })
);

// 4. Static files middleware
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/insertImage", express.static(path.join(__dirname, "insertImage")));
app.use(express.static(path.join(__dirname, "public")));

// 5. Routes
app.use("/api", Routes);
app.use("/api", fashionRoutes);
app.use("/api", VideoRoutes);
app.use("/api", DigitalEditionRoutes);
app.use("/api", latestRoutes);
app.use("/api", newRoutes);
app.use("/api", commentRoutes);
app.use("/api", UserRoutes);
app.use("/api", PostsRoutes);
app.use("/api", authorRoutes);
app.use("/api/visits", visitRoutes);

// Test route
app.get("/", (req, res) => {
  res.json("This API is available!!");
});

// 6. Error handling middleware (should be last)
app.use(errorHandlingMiddleware);

// Server startup
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled Rejection:", err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
