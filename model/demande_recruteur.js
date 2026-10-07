var db = require("./db.js");

const dr = {
  read: (id_can, siren, callback) => {
    let sql = "SELECT * FROM DemandeRecruteur WHERE id_can = ? AND siren = ?";
    db.query(sql, [id_can, siren], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM DemandeRecruteur", (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },
  creat: (id_can, siren, descriptionDR, statutDR, callback) => {
    // vérification non null et types cohérents
    if (
      !id_can ||
      typeof id_can !== "number" ||
      !siren ||
      typeof siren !== "string" ||
      !descriptionDR ||
      typeof descriptionDR !== "string" ||
      !statutDR ||
      !["validee", "refusee", "en_attente"].includes(statutDR)
    ) {
      return callback(null, null);
    }

    // Vérification que l'id_can existe dans Candidat
    const sqlVerifCandidat = "SELECT 1 FROM Candidat WHERE id_can = ?";
    db.query(sqlVerifCandidat, [id_can], (err, resCand) => {
      if (err) return callback(err, null);
      if (resCand.length === 0) return callback(null, null);

      // Vérification que le siren existe dans Organisation
      const sqlVerifSiren = "SELECT 1 FROM Organisation WHERE siren = ?";
      db.query(sqlVerifSiren, [siren], (err, resSiren) => {
        if (err) return callback(err, null);
        if (resSiren.length === 0) return callback(null, null);

        // Vérifie s’il existe déjà une demande identique
        dr.read(id_can, siren, (result) => {
          if (result && result.length > 0) return callback(null, null);

          // Insertion de la demande
          const sql =
            "INSERT INTO DemandeRecruteur (id_can, siren, descriptionDR, dateDemandeDR, statutDR) VALUES (?, ?, ?, ?, ?)";
          const dateDemandeDR = new Date().toISOString().split("T")[0];
          db.query(
            sql,
            [id_can, siren, descriptionDR, dateDemandeDR, statutDR],
            (err, results) => {
              if (err) return callback(err, null);
              callback(null, results.insertId);
            }
          );
        });
      });
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de DemandeRecruteur en clé
  update: (id_can, siren, nv_siren, dictUpdate, callback) => {
    if (!nv_siren || typeof nv_siren !== "string") callback(null);
    // vérification si la demande existe
    db.query(
      "SELECT * FROM DemandeRecruteur WHERE id_can = ? AND siren = ?",
      [id_can, siren],
      (err, results) => {
        if (err) return callback(err, null);
        if (results.length === 0) return callback(null, null);

        // vérification si dict est du bon format
        const champsValides = ["descriptionDR", "statutDR"];
        const keyslist = Object.keys(dictUpdate);
        if (!keyslist.every((k) => champsValides.includes(k)))
          return callback(null, null);
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(([_, valeur]) => valeur !== null)
        );

        if (Object.keys(nvdict) !== 0) {
          // vérification si tous les types sont bien des strings
          const valueslist = Object.values(nvdict);
          if (!valueslist.every((valeur) => typeof valeur === "string"))
            return callback(null, null);

          // vérification si le nouveau statut est bien compris entre 'validee', 'refusee' et 'en_attente'
          if (
            "statutDR" in nvdict &&
            !["validee", "refusee", "en_attente"].includes(nvdict.statutDR)
          )
            return callback(null, null);

          // Vérification que le nv_siren existe dans Organisation
          const sqlVerifNvSiren = "SELECT 1 FROM Organisation WHERE siren = ?";
          db.query(sqlVerifNvSiren, [nv_siren], (err, resSiren) => {
            if (err) return callback(err, null);
            if (resSiren.length === 0) return callback(null, null);

            const champs = Object.keys(nvdict);
            const values = Object.values(nvdict);
            const clause = champs.map((k) => `${k} = ?`).join(", ");

            // vérification que la demande avec le nouveau siren n'existe pas dans la table demandeChO
            if (siren !== nv_siren) {
              const req =
                "SELECT 1 FROM DemandeRecruteur WHERE id_can = ? AND siren = ?";
              db.query(req, [id_can, nv_siren], (err, res) => {
                if (err) return callback(err, null);
                if (res.length > 0) return callback(null, null);

                const sql = `UPDATE DemandeRecruteur SET siren = ?, ${clause} WHERE id_can = ? AND siren = ?`;
                db.query(
                  sql,
                  [nv_siren, ...values, id_can, siren],
                  (err, results) => {
                    if (err) return callback(err, null);
                    callback(null, results.affectedRows);
                  }
                );
              });
            } else {
              // Mise à jour directe sans changement de clé
              const sql = `UPDATE DemandeRecruteur SET ${clause} WHERE id_can = ? AND siren = ?`;
              db.query(sql, [...values, id_can, siren], (err, results) => {
                if (err) return callback(err, null);
                callback(null, results.affectedRows);
              });
            }
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
