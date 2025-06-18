var db = require("./db.js");

const dcho = {
  read: (id_rec, siren, callback) => {
    let sql =
      "SELECT * FROM DemandeChangerOrganisation WHERE id_rec = ? AND siren = ?";
    db.query(sql, [id_rec, siren], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM DemandeChangerOrganisation", (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },
  creat: (id_rec, siren, descriptionChO, statutChO, callback) => {
    // vérification non null et types cohérents
    if (
      !id_rec ||
      typeof id_rec !== "number" ||
      !siren ||
      typeof siren !== "string" ||
      !descriptionChO ||
      typeof descriptionChO !== "string" ||
      !statutChO ||
      !["validee", "refusee", "en_attente"].includes(statutChO)
    ) {
      return callback(null);
    }

    // Vérifie d'abord si le siren existe dans Organisation
    const sqlOrg = "SELECT 1 FROM Organisation WHERE siren = ?";
    db.query(sqlOrg, [siren], (err, resOrg) => {
      if (err) throw err;
      if (resOrg.length === 0) return callback(null);

      // Vérifie si le recruteur est déjà dans cette organisation
      const sqlVerif = "SELECT 1 FROM Recruteur WHERE id_rec = ? AND siren = ?";
      db.query(sqlVerif, [id_rec, siren], (err, resVerif) => {
        if (err) throw err;
        if (resVerif.length > 0) return callback(null);

        // Vérifie si une demande identique existe déjà
        dcho.read(id_rec, siren, (result) => {
          if (result && result.length > 0) return callback(null);

          // Insertion de la nouvelle demande
          const sql =
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
        });
      });
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de DemandeChangerOrganisation en clé
  update: (id_rec, siren, nv_siren, dictUpdate, callback) => {
    if (!nv_siren || typeof nv_siren !== "string") callback(null);
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

          // Vérification que le nv_siren existe dans Organisation
          const sqlVerifNvSiren = "SELECT 1 FROM Organisation WHERE siren = ?";
          db.query(sqlVerifNvSiren, [nv_siren], (err, resSiren) => {
            if (err) throw err;
            if (resSiren.length === 0) return callback(null);

            // vérification que la demande avec le nouveau siren n'existe pas dans la table demandeChO
            if (siren !== nv_siren) {
              const req =
                "SELECT * FROM DemandeChangerOrganisation WHERE id_rec = ? AND siren = ?";
              db.query(req, [id_rec, nv_siren], (err, result) => {
                if (err) throw err;
                if (result.length !== 0) return callback(null);
              });
            }

            // mise à jour de la BDD
            const champs = Object.keys(nvdict);
            const values = Object.values(nvdict);
            const clause = champs.map((k) => `${k} = ?`).join(", ");
            const sql = `UPDATE DemandeChangerOrganisation SET siren = ?, ${clause} WHERE id_rec = ? AND siren = ?`;
            db.query(
              sql,
              [nv_siren, ...values, id_rec, siren],
              (err, results) => {
                if (err) throw err;
                callback(results.affectedRows);
              }
            );
          });
        }
      }
    );
  },
  delete: (id_rec, siren, callback) => {
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
