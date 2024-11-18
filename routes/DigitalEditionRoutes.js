// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");

// // Import controller functions
// const {
//   createDigitalEdition,
//   getAllDigitalEditions,
//   getDigitalEditionById,
//   getDigitalEditionBySlug,
//   updateDigitalEdition,
//   deleteDigitalEdition,
// } = require("../controllers/DigitalEditionController");

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 100 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const pdfFileTypes = /pdf/;
//     const extName = path.extname(file.originalname).toLowerCase();

//     if (pdfFileTypes.test(extName) && /pdf/.test(file.mimetype)) {
//       return cb(null, true);
//     } else {
//       cb("Error: You can only upload PDF files!");
//     }
//   },
// });

// // Define the route for creating a digital edition with multiple PDF uploads
// router.post(
//   "/createDigitalEdition",
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 100 }, // Allow multiple PDF uploads
//   ]),
//   createDigitalEdition
// );
// router.get("/getAllDigitalEditions", getAllDigitalEditions);
// router.get("/getDigitalEditionBySlug/:slug", getDigitalEditionBySlug);
// router.get("/getDigitalEditionById/:digitalEditionId", getDigitalEditionById);
// router.delete("/deleteDigitalEdition/:id", deleteDigitalEdition);
// router.put(
//   "/updateDigitalEdition/:digitalEditionId",
//   upload.fields([
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 150 }, // Allow multiple PDF uploads
//   ]),
//   updateDigitalEdition
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controller functions
const {
  createDigitalEdition,
  getAllDigitalEditions,
  getDigitalEditionById,
  getDigitalEditionBySlug,
  updateDigitalEdition,
  deleteDigitalEdition,
} = require("../controllers/DigitalEditionController");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "image1") {
      // Allow image files for image1
      const imageFileTypes = /jpeg|jpg|png|gif|webp/;
      const mimeTypes = /image\/(jpeg|jpg|png|gif|webp)/;
      const extName = path
        .extname(file.originalname)
        .toLowerCase()
        .substring(1);

      if (imageFileTypes.test(extName) && mimeTypes.test(file.mimetype)) {
        return cb(null, true);
      } else {
        cb("Error: You can only upload image files (JPEG, PNG, GIF, WebP)!");
      }
    } else if (file.fieldname === "image2") {
      // Keep PDF validation for image2
      const pdfFileTypes = /pdf/;
      const extName = path.extname(file.originalname).toLowerCase();

      if (pdfFileTypes.test(extName) && /pdf/.test(file.mimetype)) {
        return cb(null, true);
      } else {
        cb("Error: You can only upload PDF files for flipbook!");
      }
    }
  },
});

// Define the route for creating a digital edition with multiple PDF uploads
router.post(
  "/createDigitalEdition",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 100 }, // Allow multiple PDF uploads
  ]),
  createDigitalEdition
);
router.get("/getAllDigitalEditions", getAllDigitalEditions);
router.get("/getDigitalEditionBySlug/:slug", getDigitalEditionBySlug);
router.get("/getDigitalEditionById/:digitalEditionId", getDigitalEditionById);
router.delete("/deleteDigitalEdition/:id", deleteDigitalEdition);
router.put(
  "/updateDigitalEdition/:digitalEditionId",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 150 }, // Allow multiple PDF uploads
  ]),
  updateDigitalEdition
);

module.exports = router;
