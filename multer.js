const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// extensions authorisées
const allowedExtensions = [".pdf", ".jpeg", ".png", ".xlsx", ".docx"];

// création d'une configuration de stockage pour multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .trim()
      .replace(/[^a-z0-9_\-]/gi, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    const uuid = uuidv4();
    const finalName = `${base}_${timestamp}_${uuid}${ext}`;
    cb(null, finalName);
  },
});

// permet d'appliquer le filtre sur le nouveau fichier
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    const error = new Error(`Extension non autorisée : ${ext}`);
    error.code = "EXTENSION_NON_AUTORISEE";
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1000 * 1024 }, // 1 Mo
});

module.exports = upload;
