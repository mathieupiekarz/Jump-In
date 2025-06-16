var db = require("./db.js");

const candidature = {
  read: (id_can, num_OE, callback) => {
    let sql = "SELECT * FROM Candidature WHERE id_can = ? AND num_OE = ?";
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
    db.query("SELECT * FROM Candidature", (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readWithCandidatAndOffre: (numero, id_can, callback) => {
    let sql = `SELECT o.numero, o.etat, o.date_validite, o.indication, o.nb_pieces_demandees,
          f.id_fiche, f.intitule, f.statut_de_poste, f.responsable_hierarchique,
          f.type_metier, f.lieu_mission, f.rythme, f.fourchette_salaire, f.description,
          org.nom AS organisation_nom, org.siren, org.type, org.siege_social,
          c.date_candidature
        FROM Offre_Emploi o
        JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
        JOIN Organisation org ON f.siren = org.siren
        JOIN Candidature c ON o.numero = c.num_OE
        WHERE o.numero = ? AND c.id_can = ?`;
    db.query(sql, [numero, id_can], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      else callback(results);
    });
  },

  readCandidaturesWithOffreDetails: (id_can, callback) => {
    let sql = `
      SELECT o.numero, o.etat, o.date_validite, o.indication, o.nb_pieces_demandees,
        f.id_fiche, f.intitule, f.statut_de_poste, f.responsable_hierarchique,
        f.type_metier, f.lieu_mission, f.rythme, f.fourchette_salaire, f.description,
        org.nom AS organisation_nom, org.siren, org.type, org.siege_social,
        c.date_candidature
      FROM Candidature c
      JOIN Offre_Emploi o ON c.num_OE = o.numero
      JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
      JOIN Organisation org ON f.siren = org.siren
      WHERE c.id_can = ?
    `;
    db.query(sql, [id_can], (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des candidatures:", err);
        callback([]);
      } else {
        if (results.length === 0) return callback(null);
        else callback(results);
      }
    });
  },

  creat: (id_can, num_OE, callback) => {
    // vérification non null et types cohérents
    if (
      !id_can ||
      typeof id_can !== "number" ||
      !num_OE ||
      typeof num_OE !== "number"
    ) {
      return callback(null);
    }

    // Vérification si le candidat existe
    db.query(
      "SELECT 1 FROM Candidat WHERE id_can = ?",
      [id_can],
      (err, resCan) => {
        if (err) throw err;
        if (resCan.length === 0) return callback(null); // id_can inexistant

        // Vérification si l'offre d'emploi existe
        db.query(
          "SELECT 1 FROM Offre_Emploi WHERE numero = ?",
          [num_OE],
          (err, resOffre) => {
            if (err) throw err;
            if (resOffre.length === 0) return callback(null); // num_OE inexistant

            // Vérification si une candidature existe déjà
            candidature.read(id_can, num_OE, (result) => {
              if (result && result.length > 0) return callback(null);

              // Insertion si tout est valide
              const sql =
                "INSERT INTO Candidature (id_can, num_OE, date_candidature) VALUES (?, ?, ?)";
              const date_candidature = new Date().toISOString().split("T")[0];
              db.query(
                sql,
                [id_can, num_OE, date_candidature],
                (err, results) => {
                  if (err) throw err;
                  callback(results);
                }
              );
            });
          }
        );
      }
    );
  },
  delete: (id_can, num_OE, callback) => {
    const sqlCheck =
      "SELECT 1 FROM Candidature WHERE id_can = ? AND num_OE = ?";
    db.query(sqlCheck, [id_can, num_OE], (err, rows) => {
      if (err) {
        console.error("Erreur vérif candidature:", err);
        return callback(err, null);
      }
      if (rows.length === 0) return callback(null, 0);

      // Suppression de la candidature
      const sqlDel = "DELETE FROM Candidature WHERE id_can = ? AND num_OE = ?";
      db.query(sqlDel, [id_can, num_OE], (err2, result2) => {
        if (err2) {
          console.error("Erreur suppression candidature:", err2);
          return callback(err2, null);
        }
        callback(null, result2.affectedRows);
      });
    });
  },

  readByOffreWithCandidat: (num_OE, callback) => {
    const sql = `
      SELECT c.*, cd.nom, cd.prenom, cd.email, cd.numero_telephone, cd.statut as statut_candidat
      FROM Candidature c
      JOIN Candidat cd ON c.id_can = cd.id_can
      WHERE c.num_OE = ?
      ORDER BY c.date_candidature DESC
    `;

    db.query(sql, [num_OE], (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des candidatures:", err);
        callback([]);
      } else {
        callback(results);
      }
    });
  },
};

module.exports = candidature;
