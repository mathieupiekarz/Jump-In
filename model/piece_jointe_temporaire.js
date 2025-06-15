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
  readByCandidature: (id_can, num_OE, callback) => {
    let sql =
      "SELECT * FROM Piece_Jointe_Temporaire WHERE id_can = ? AND num_OE = ?";
    db.query(sql, [id_can, num_OE], (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des candidatures:", err);
        callback([]);
      } else {
        if (results.length === 0) return callback(null);
        else callback(results);
      }
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
    // Vérification que la pièce existe
    db.query(
      "SELECT * FROM Piece_Jointe_Temporaire WHERE nom = ?",
      [nom],
      (err, results) => {
        if (err) {
          return callback(err);
        }
        // si pas de ligne, on considère qu'il n'y a rien à faire
        if (results.length === 0) {
          return callback(null, 0);
        }

        // filtre dictUpdate pour ne garder que les clés autorisées et les valeurs non-nulles
        const champsValides = ["nom", "type"];
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(
            ([key, valeur]) =>
              champsValides.includes(key) &&
              valeur != null &&
              typeof valeur === "string"
          )
        );

        // si après filtrage il n'y a plus rien, on ne fait rien
        if (Object.keys(nvdict).length === 0) {
          return callback(null, 0);
        }

        // Si champ "type", on vérifie qu'il est bien dans la liste autorisée
        if (
          "type" in nvdict &&
          !["pdf", "jpeg", "png", "xlsx", "docx"].includes(nvdict.type)
        ) {
          return callback(null, 0);
        }

        // Construction dynamique de la requête UPDATE
        const champs = Object.keys(nvdict);
        const values = champs.map((k) => nvdict[k]);
        const clause = champs.map((k) => `${k} = ?`).join(", ");
        const sql = `UPDATE Piece_Jointe_Temporaire SET ${clause} WHERE nom = ?`;

        // Exécution
        db.query(sql, [...values, nom], (err2, result2) => {
          if (err2) {
            return callback(err2);
          }
          // on renvoie le nombre de lignes affectées
          callback(result2.affectedRows);
        });
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
