var db = require("./db.js");

const pjt = {
  read: (nom, callback) => {
    let sql = "SELECT * FROM Piece_Jointe_Temporaire WHERE nom = ?";
    db.query(sql, [nom], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Piece_Jointe_Temporaire", (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  creat: (nom, type, id_can, num_OE, callback) => {
    if (
      !nom ||
      typeof nom !== "string" ||
      !type ||
      !["pdf", "jpeg", "png", "xlsx", "docx"].includes(type) ||
      typeof id_can !== "number" ||
      typeof num_OE !== "number"
    )
      return callback(null);

    pjt.read(nom, (result) => {
      if (result && result.length > 0) return callback(null);

      const sql_can = "SELECT 1 FROM Candidat WHERE id_can = ?";
      db.query(sql_can, [id_can], (err, resCan) => {
        if (err || resCan.length === 0) return callback(null);

        const sql_offre = "SELECT 1 FROM Offre_Emploi WHERE numero = ?";
        db.query(sql_offre, [num_OE], (err, resOffre) => {
          if (err || resOffre.length === 0) return callback(null);

          const sql =
            "INSERT INTO Piece_Jointe_Temporaire (nom, type, id_can, num_OE) VALUES (?, ?, ?, ?)";
          db.query(sql, [nom, type, id_can, num_OE], (err, results) => {
            if (err) {
              console.error(err);
              return callback(null);
            }
            callback(results);
          });
        });
      });
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de piece_jointe_temporaire en clé
  update: (nom, dictUpdate, callback) => {
    // vérification si la piece jointe temporaire existe
    db.query(
      "SELECT * FROM Piece_Jointe_Temporaire WHERE nom = ?",
      [nom],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dict est du bon format
        const champsValides = ["nom", "type"];
        const keyslist = Object.keys(dictUpdate);
        if (!keyslist.every((k) => champsValides.includes(k)))
          return callback(null);
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(([_, valeur]) => valeur !== null)
        );

        if (Object.keys(nvdict) !== 0) {
          // vérification si tous les types sont bien des strings
          const valueslist = Object.values(nvdict);
          if (!valueslist.every((valeur) => typeof valeur === "string"))
            return callback(null);

          // vérification si le nouveau type respecte toutes les possibilités
          if (
            "type" in nvdict &&
            !["pdf", "jpeg", "png", "xlsx", "docx"].includes(nvdict.type)
          )
            return callback(null);

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Piece_Jointe_Temporaire SET ${clause} WHERE chemin = ?`;
          db.query(sql, [...values, chemin], (err, results) => {
            if (err) throw err;
            callback(results.affectedRows);
          });
        }
      }
    );
  },
  delete: (chemin, callback) => {
    // vérification si la piece jointe temporaire existe
    db.query(
      "SELECT * FROM Piece_Jointe_Temporaire WHERE chemin = ?",
      [chemin],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Piece_Jointe_Temporaire WHERE chemin = ?";
        db.query(sql, [chemin], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = pjt;
