const fs = require("fs");
const mammoth = require("mammoth");
const path = require("path");

async function checkFileContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".docx") {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;
      // Expression régulière avec le flag "g" pour trouver toutes les occurrences
      const matches = text.match(
        /(<?php|shell_exec|eval|base64_decode|exec|system)/gi
      );
      if (matches) {
        console.log(`DOCX interdit : ${matches.join(", ")}`);
        return true;
      }
    } catch (err) {
      console.error("Erreur lecture DOCX :", err);
    }
    return false;
  }

  // pour les autres fichiers : PDF, etc.
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const matches = content.match(
      /(<?php|shell_exec|eval|base64_decode|exec|system)/gi
    );
    if (matches) {
      console.log(`Contenu interdit dans ${filePath} : ${matches.join(", ")}`);
      return true;
    }
  } catch (err) {
    console.error("Erreur lecture fichier texte :", err);
  }

  return false;
}

module.exports = { checkFileContent };
