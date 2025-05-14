var db = require("./db.js");

const dr = {
  read: (id_can, siren, callback) => {
    let sql = "SELECT * FROM DemandeRecruteur WHERE id_can = ? AND siren = ?";
    db.query(sql, [id_can, siren], (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM DemandeRecruteur", (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  creat: (id_can, siren, descriptionDR, statutDR, callback) => {
    // vérification non null et types cohérents
    if (
      !id_can ||
      typeof id_can !== "int" ||
      !siren ||
      typeof siren !== "string" ||
      !descriptionDR ||
      typeof descriptionDR !== "string" ||
      !statutDR ||
      !["validee", "refusee", "en_attente"].includes(statutDR)
    ) {
      return callback(null);
    }

    // vérification si une demande existante a déjà le même id_can et siren
    dr.read(id_can, siren, (result) => {
      if (result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO DemandeRecruteur (id_can, siren, descriptionDR, dateDemandeDR, statutDR) VALUES (?, ?, ?, ?, ?)";
        const dateDemandeDR = new Date().toISOString().split("T")[0];
        db.query(
          sql,
          [id_can, siren, descriptionDR, dateDemandeDR, statutDR],
          (err, results) => {
            if (err) throw err;
            callback(results.insertId);
          }
        );
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de DemandeRecruteur en clé
  update: (id_can, siren, dictUpdate, callback) => {
    // vérification si la demande existe
    db.query(
      "SELECT * FROM DemandeRecruteur WHERE id_can = ? AND siren = ?",
      [id_can, siren],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dict est du bon format
        const champsValides = ["descriptionDR", "statutDR"];
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

          // vérification si le nouveau statut est bien compris entre 'validee', 'refusee' et 'en_attente'
          if (
            "statutDR" in nvdict &&
            !["validee", "refusee", "en_attente"].includes(nvdict.statutDR)
          )
            return callback(null);

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE DemandeRecruteur SET ${clause} WHERE id_can = ? AND siren = ?`;
          db.query(sql, [...values, id_can, siren], (err, results) => {
            if (err) throw err;
            callback(results.affectedRows);
          });
        }
      }
    );
  },
  delete: (id_can, siren, callback) => {
    // vérification si la demande existe
    db.query(
      "SELECT * FROM DemandeRecruteur WHERE id_can = ? AND siren = ?",
      [id_can, siren],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM DemandeRecruteur WHERE id_can = ? AND siren = ?";
        db.query(sql, [id_can, siren], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = dr;
