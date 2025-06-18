const fs = require("fs");
const mammoth = require("mammoth");
const path = require("path");
const xlsx = require("xlsx");

async function checkFileContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const regex = /(<?php|shell_exec|eval|base64_decode|exec|system)/gi;

  if (ext === ".docx") {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const matches = result.value.match(regex);
      if (matches) {
        console.log(`DOCX interdit : ${matches.join(", ")}`);
        return true;
      }
    } catch (err) {
      console.error("Erreur lecture DOCX :", err);
    }
  } else if (ext === ".xlsx") {
    try {
      const workbook = xlsx.readFile(filePath);
      const text = Object.values(workbook.Sheets)
        .map((sheet) => xlsx.utils.sheet_to_csv(sheet))
        .join("\n");
      const matches = text.match(regex);
      if (matches) {
        console.log(`XLSX interdit : ${matches.join(", ")}`);
        return true;
      }
    } catch (err) {
      console.error("Erreur lecture XLSX :", err);
    }
  } else if ([".png", ".jpeg", ".jpg", "pdf"].includes(ext)) {
    // Optionnel : ne pas lire les images en texte
    return false;
  } else {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const matches = content.match(regex);
      if (matches) {
        console.log(
          `Contenu interdit dans ${filePath} : ${matches.join(", ")}`
        );
        return true;
      }
    } catch (err) {
      console.error("Erreur lecture fichier texte :", err);
    }
  }

  return false;
}

module.exports = { checkFileContent };
