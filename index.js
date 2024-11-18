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
// const FamilyRoutes = require("./routes/familyRoute.js");
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
// app.use(express.json());
// app.use(morgan("dev"));
// app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));

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
// app.use("/api", FamilyRoutes);
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
// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.config");
const { errorHandlingMiddleware } = require("./middlewares/errorHandling.js");

// Route imports
const Routes = require("./routes/route.js");
const fashionRoutes = require("./routes/fashoinRoute.js");
const VideoRoutes = require("./routes/videoRoutes.js");
const FamilyRoutes = require("./routes/familyRoute.js");
const DigitalEditionRoutes = require("./routes/DigitalEditionRoutes.js");
const latestRoutes = require("./routes/latestRoutes.js");
const newRoutes = require("./routes/NewsRoutes.js");
const commentRoutes = require("./routes/commentRoute.js");
const UserRoutes = require("./routes/userRoutes.js");
const PostsRoutes = require("./routes/postRoutes.js");
const authorRoutes = require("./routes/authorRoutes.js");

dotenv.config();

// Initialize express
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Session configuration - only one instance
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

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/insertImage", express.static(path.join(__dirname, "insertImage")));
app.use(express.static(path.join(__dirname, "public")));

// Error handling middleware should come after routes
app.use(errorHandlingMiddleware);

// API Routes
app.use("/api", Routes);
app.use("/api", fashionRoutes);
app.use("/api", VideoRoutes);
app.use("/api", FamilyRoutes);
app.use("/api", DigitalEditionRoutes);
app.use("/api", latestRoutes);
app.use("/api", newRoutes);
app.use("/api", commentRoutes);
app.use("/api", UserRoutes);
app.use("/api", PostsRoutes);
app.use("/api", authorRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "API is running" });
});

// For Vercel serverless functions
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
