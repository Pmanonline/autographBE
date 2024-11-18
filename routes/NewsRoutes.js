const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controller functions
const {
  createNews,
  getAllNews,
  getNewsById,
  getNewsBySlug,
  updateNews,
  deleteNews,
  NewLetterSubscribe,
  getNewsletterSubscribers,
} = require("../controllers/NewsController");

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

const checkFileType = (file, cb) => {
  const imageFileTypes = /jpeg|jpg|png|gif|svg/;

  // Check file extension
  const extName = path.extname(file.originalname).toLowerCase();

  if (imageFileTypes.test(extName) && /image/.test(file.mimetype)) {
    return cb(null, true);
  } else {
    cb("Error: You can only upload image files (jpeg, jpg, png, gif, svg)!");
  }
};

// Define routes
router.post("/createNews", upload.single("image"), createNews);
router.get("/getAllNews", getAllNews);
router.get("/getNewsBySlug/:slug", getNewsBySlug);
router.get("/getNewsById/:NewsId", getNewsById);
router.delete("/deleteNews/:id", deleteNews);
router.put("/updateNews/:NewsId", upload.single("image"), updateNews);
router.post("/newsletter-signup", NewLetterSubscribe);
router.get("/getNewsletterSubscribers", getNewsletterSubscribers);

module.exports = router;
