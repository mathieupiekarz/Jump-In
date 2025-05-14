var db = require("./db.js");

const dcho = {
  read: (id_rec, siren, callback) => {
    let sql =
      "SELECT * FROM DemandeChangerOrganisation WHERE id_rec = ? AND siren = ?";
    db.query(sql, [id_rec, siren], (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM DemandeChangerOrganisation", (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  creat: (id_rec, siren, descriptionChO, statutChO, callback) => {
    // vérification non null et types cohérents
    if (
      !id_rec ||
      typeof id_rec !== "int" ||
      !siren ||
      typeof siren !== "string" ||
      !descriptionChO ||
      typeof descriptionChO !== "string" ||
      !statutChO ||
      !["validee", "refusee", "en_attente"].includes(statutChO)
    ) {
      return callback(null);
    }

    // vérification si une demande existante a déjà le même id_rec et siren
    dcho.read(id_rec, siren, (result) => {
      if (result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO DemandeChangerOrganisation (id_rec, siren, descriptionChO, dateDemandeChO, statutChO) VALUES (?, ?, ?, ?, ?)";
        const dateDemandeChO = new Date().toISOString().split("T")[0];
        db.query(
          sql,
          [id_rec, siren, descriptionChO, dateDemandeChO, statutChO],
          (err, results) => {
            if (err) throw err;
            callback(results.insertId);
          }
        );
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de DemandeChangerOrganisation en clé
  update: (id_rec, siren, dictUpdate, callback) => {
    // vérification si la demande existe
    db.query(
      "SELECT * FROM DemandeChangerOrganisation WHERE id_rec = ? AND siren = ?",
      [id_rec, siren],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dict est du bon format
        const champsValides = ["descriptionChO", "statutChO"];
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
            "statutChO" in nvdict &&
            !["validee", "refusee", "en_attente"].includes(nvdict.statutChO)
          )
            return callback(null);

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE DemandeChangerOrganisation SET ${clause} WHERE id_rec = ? AND siren = ?`;
          db.query(sql, [...values, id_rec, siren], (err, results) => {
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
      "SELECT * FROM DemandeChangerOrganisation WHERE id_rec = ? AND siren = ?",
      [id_rec, siren],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql =
          "DELETE FROM DemandeChangerOrganisation WHERE id_rec = ? AND siren = ?";
        db.query(sql, [id_rec, siren], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = dcho;
