const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controller functions
const {
  createFashion,
  getAllFashion,
  getFashionById,
  getFashionBySlug,
  updateFashion,
  deleteFashion,
  uploadQuillImage,
} = require("../controllers/fashionController");

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
  "/createFashion",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 5 }, // Allow up to 5 images for image2
    { name: "videoClip", maxCount: 1 },
  ]),
  createFashion
);
router.get("/getAllFashion", getAllFashion);
router.get("/getFashionBySlug/:slug", getFashionBySlug);
router.get("/getFashionById/:fashionId", getFashionById);
router.delete("/deleteFashion/:id", deleteFashion);
router.post("/upload-quill-image", upload.single("image"), uploadQuillImage);
router.put(
  "/updateFashion/:fashionId",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 5 }, // Allow up to 5 images for image2
    { name: "videoClip", maxCount: 1 },
  ]),
  updateFashion
);

module.exports = router;
