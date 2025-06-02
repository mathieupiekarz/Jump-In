var db = require("./db.js");

const pjt = {
  read: (chemin, callback) => {
    let sql = "SELECT * FROM Piece_Jointe_Temporaire WHERE chemin = ?";
    db.query(sql, [chemin], (err, results) => {
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
  creat: (chemin, nom, type, id_can, num_OE, callback) => {
    // vérification non null et types cohérents
    if (
      !chemin ||
      typeof chemin !== "string" ||
      !nom ||
      typeof nom !== "string" ||
      !type ||
      !["pdf", "jpeg", "png", "xlsx", "docx"].includes(type) ||
      !id_can ||
      typeof id_can !== "number" ||
      !num_OE ||
      typeof num_OE !== "number"
    ) {
      return callback(null);
    }

    // vérification si une piece jointe existante a déjà le même chemin
    pjt.read(chemin, (result) => {
      if (result && result.length > 1) return callback(null);
      else {
        // vérification si le candidat existe
        let sql_can = "SELECT * FROM Candidat WHERE id_can = ?";
        db.query(sql_can, [id_can], (err, results) => {
          if (err) throw err;
          if (results.length === 0) return callback(null);

          /// vérification si l'offre existe
          let sql_numero = "SELECT * FROM Offre_Emploi WHERE numero = ?";
          db.query(sql_numero, [num_OE], (err, results) => {
            if (err) throw err;
            if (results.length === 0) return callback(null);

            // insertion
            let sql =
              "INSERT INTO Piece_Jointe_Temporaire (chemin, nom, type, id_can, num_OE) VALUES (?, ?, ?, ?, ?)";
            db.query(
              sql,
              [chemin, nom, type, id_can, num_OE],
              (err, results) => {
                if (err) throw err;
                callback(results.insertId);
              }
            );
          });
        });
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de piece_jointe_temporaire en clé
  update: (chemin, dictUpdate, callback) => {
    // vérification si la piece jointe temporaire existe
    db.query(
      "SELECT * FROM Piece_Jointe_Temporaire WHERE chemin = ?",
      [chemin],
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
