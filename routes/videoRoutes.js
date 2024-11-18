const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controller functions
const {
  UploadVideo,
  getAllVideos,
  getVideosById,
  getVideosBySlug,
  updateVideo,
  deleteVideo,
} = require("../controllers/VideoUploadsController");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    console.log("Saving file with name:", file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Increased limit to 50MB for video
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

const checkFileType = (file, cb) => {
  const imageFileTypes = /jpeg|jpg|png|gif|svg/;
  const videoFileTypes = /mp4|mov|avi|wmv/;

  // Check file extension
  const extName = path.extname(file.originalname).toLowerCase();

  // Check MIME type
  if (file.fieldname === "videoClip") {
    if (videoFileTypes.test(extName) && /video/.test(file.mimetype)) {
      return cb(null, true);
    } else {
      cb("Error: You can only upload video files (mp4, mov, avi, wmv)!");
    }
  } else {
    if (imageFileTypes.test(extName) && /image/.test(file.mimetype)) {
      return cb(null, true);
    } else {
      cb("Error: You can only upload image files (jpeg, jpg, png, gif, svg)!");
    }
  }
};

// Define the route for creating a post with multiple file uploads
router.post(
  "/UploadVideo",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "videoClip", maxCount: 1 },
  ]),
  UploadVideo
);
router.get("/getAllVideos", getAllVideos);
router.get("/getVideosBySlug/:slug", getVideosBySlug);
router.get("/getVideosById/:VideoId", getVideosById);
router.delete("/deleteVideo/:id", deleteVideo);

router.put(
  "/updateVideo/:VideoId",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "videoClip", maxCount: 1 },
  ]),
  updateVideo
);

module.exports = router;
