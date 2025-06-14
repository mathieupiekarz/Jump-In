const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    const finalName = `${base}_${timestamp}${ext}`;

    cb(null, finalName);
  },
});

const upload = multer({ storage });

module.exports = upload;
