var db = require("./db.js");

const candidature = {
  read: (id_can, num_OE, callback) => {
    let sql = "SELECT * FROM Candidature WHERE id_can = ? AND num_OE = ?";
    db.query(sql, [id_can, num_OE], (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Candidature", (err, results) => {
      if (err) throw err;
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
      callback(results);
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
        callback(results);
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

    // vérification si une candidature existe déjà pour ce candidat et cette offre d'emploi
    candidature.read(id_can, num_OE, (result) => {
      if (result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO Candidature (id_can, num_OE, date_candidature) VALUES (?, ?, ?)";
        const date_candidature = new Date().toISOString().split("T")[0];
        db.query(sql, [id_can, num_OE, date_candidature], (err, results) => {
          if (err) throw err;
          callback(results.insertId);
        });
      }
    });
  },
  delete: (id_can, num_OE, callback) => {
    // vérification si la candidature existe
    db.query(
      "SELECT * FROM Candidature WHERE id_can = ? AND num_OE = ?",
      [id_can, num_OE],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Candidature WHERE id_can = ? AND num_OE = ?";
        db.query(sql, [id_can, num_OE], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = candidature;
