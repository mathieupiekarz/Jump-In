var db = require("./db.js");

const dco = {
  read: (id_can, siren, callback) => {
    let sql =
      "SELECT * FROM DemandeCreationOrganisation WHERE id_can = ? AND siren = ?";
    db.query(sql, [id_can, siren], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM DemandeCreationOrganisation", (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  creat: (id_can, siren, descriptionCrO, statutCrO, callback) => {
    // vérification non null et types cohérents
    if (
      !id_can ||
      typeof id_can !== "number" ||
      !siren ||
      typeof siren !== "string" ||
      !descriptionCrO ||
      typeof descriptionCrO !== "string" ||
      !statutCrO ||
      !["validee", "refusee", "en_attente"].includes(statutCrO)
    ) {
      return callback(null);
    }

    // Vérifier que le siren n'existe pas déjà dans Organisation
    const sqlVerifSiren = "SELECT 1 FROM Organisation WHERE siren = ?";
    db.query(sqlVerifSiren, [siren], (err, resSiren) => {
      if (err) throw err;
      if (resSiren.length > 0) return callback(null);

      // Vérification si une demande identique existe déjà
      dco.read(id_can, siren, (result) => {
        if (result && result.length > 0) return callback(null);

        // Insertion de la nouvelle demande
        const sql =
          "INSERT INTO DemandeCreationOrganisation (id_can, siren, descriptionCrO, dateDemandeCrO, statutCrO) VALUES (?, ?, ?, ?, ?)";
        const dateDemandeCrO = new Date().toISOString().split("T")[0];
        db.query(
          sql,
          [id_can, siren, descriptionCrO, dateDemandeCrO, statutCrO],
          (err, results) => {
            if (err) throw err;
            callback(results.insertId);
          }
        );
      });
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de DemandeCreationOrganisation en clé
  update: (id_can, siren, dictUpdate, callback) => {
    // vérification si la demande existe
    db.query(
      "SELECT * FROM DemandeCreationOrganisation WHERE id_can = ? AND siren = ?",
      [id_can, siren],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dict est du bon format
        const champsValides = ["descriptionCrO", "statutCrO"];
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
            "statutCrO" in nvdict &&
            !["validee", "refusee", "en_attente"].includes(nvdict.statutCrO)
          )
            return callback(null);

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE DemandeCreationOrganisation SET ${clause} WHERE id_can = ? AND siren = ?`;
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
      "SELECT * FROM DemandeCreationOrganisation WHERE id_can = ? AND siren = ?",
      [id_can, siren],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql =
          "DELETE FROM DemandeCreationOrganisation WHERE id_can = ? AND siren = ?";
        db.query(sql, [id_can, siren], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = dco;
