var db = require("./db.js");

const pjd = {
  read: (chemin, callback) => {
    let sql = "SELECT * FROM Piece_Jointe_Durable WHERE chemin = ?";
    db.query(sql, [chemin], (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Piece_Jointe_Durable", (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  creat: (chemin, nom, type, id_can, callback) => {
    // vérification non null et types cohérents
    if (
      !chemin ||
      typeof chemin !== "string" ||
      !nom ||
      typeof nom !== "string" ||
      !type ||
      !["pdf", "jpeg", "png", "xlsx", "docx"].includes(type) ||
      !id_can ||
      typeof id_can !== "number"
    ) {
      return callback(null);
    }

    // vérification si une piece jointe durable existante a déjà le même chemin
    pjd.read(chemin, (result) => {
      if (result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO Piece_Jointe_Durable (chemin, nom, type, id_can) VALUES (?, ?, ?, ?)";
        db.query(sql, [chemin, nom, type, id_can], (err, results) => {
          if (err) throw err;
          callback(results.insertId);
        });
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de piece_jointe_durable en clé
  update: (chemin, dictUpdate, callback) => {
    // vérification si la piece jointe durable existe
    db.query(
      "SELECT * FROM Piece_Jointe_Durable WHERE chemin = ?",
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
          const sql = `UPDATE Piece_Jointe_Durable SET ${clause} WHERE chemin = ?`;
          db.query(sql, [...values, chemin], (err, results) => {
            if (err) throw err;
            callback(results.affectedRows);
          });
        }
      }
    );
  },
  delete: (chemin, callback) => {
    // vérification si la piece jointe durable existe
    db.query(
      "SELECT * FROM Piece_Jointe_Durable WHERE chemin = ?",
      [chemin],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Piece_Jointe_Durable WHERE chemin = ?";
        db.query(sql, [chemin], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = pjd;
