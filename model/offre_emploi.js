var db = require("./db.js");

const offre = {
  read: (numero, callback) => {
    let sql = "SELECT * FROM Offre_Emploi WHERE numero = ?";
    db.query(sql, [numero], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      else callback(results);
    });
  },
  readWithFicheAndOrganisation: (numero, callback) => {
    let sql = `SELECT o.numero, o.etat, o.date_validite, o.indication, o.nb_pieces_demandees,
        f.id_fiche, f.intitule, f.statut_de_poste, f.responsable_hierarchique,
        f.type_metier, f.lieu_mission, f.rythme, f.fourchette_salaire, f.description,
        org.nom AS organisation_nom, org.siren, org.type, org.siege_social
      FROM Offre_Emploi o
      JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
      JOIN Organisation org ON f.siren = org.siren
      WHERE o.numero = ?`;
    db.query(sql, [numero], (err, results) => {
      if (err) throw err;
      for (const offre of results) {
        offre.lieu_mission = JSON.parse(offre.lieu_mission);
      }
      if (results.length === 0) return callback(null);
      else callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Offre_Emploi", (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      else callback(results);
    });
  },
  readAllWithFicheAndOrganisation: (callback) => {
    const sql = `
      SELECT 
        o.numero, o.etat, o.date_validite, o.indication, o.nb_pieces_demandees,
        f.id_fiche, f.intitule, f.statut_de_poste, f.responsable_hierarchique,
        f.type_metier, f.lieu_mission, f.rythme, f.fourchette_salaire, f.description,
        org.nom AS organisation_nom, org.siren, org.type, org.siege_social
      FROM Offre_Emploi o
      JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
      JOIN Organisation org ON f.siren = org.siren
    `;
    db.query(sql, (err, results) => {
      if (err) throw err;
      for (const offre of results) {
        offre.lieu_mission = JSON.parse(offre.lieu_mission);
      }
      if (results.length === 0) return callback(null);
      else callback(results);
    });
  },

  readSansPostulee: (id_can, callback) => {
    let sql = `SELECT tab.numero, tab.etat, tab.date_validite, tab.indication, tab.nb_pieces_demandees,
        tab.id_fiche, tab.intitule, tab.statut_de_poste, tab.responsable_hierarchique,
        tab.type_metier, tab.lieu_mission, tab.rythme, tab.fourchette_salaire, tab.description,
        org.nom AS organisation_nom, org.siren, org.type, org.siege_social FROM (SELECT 
      o.*, 
      f.intitule, 
      f.statut_de_poste, 
      f.responsable_hierarchique, 
      f.type_metier, 
      f.lieu_mission, 
      f.rythme, 
      f.fourchette_salaire, 
      f.description, 
      f.siren
    FROM Offre_Emploi o
    JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
    WHERE NOT EXISTS (
      SELECT 1
      FROM Candidature c
      WHERE c.num_OE = o.numero
        AND c.id_can = 19
    )) AS tab JOIN Organisation org ON tab.siren = org.siren`;
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

  // Récupère toutes les offres d'emploi d'une organisation spécifique
  readAllByOrganisation: (siren, callback) => {
    const sql = `
      SELECT 
        o.numero, o.etat, o.date_validite, o.indication, o.nb_pieces_demandees,
        f.id_fiche, f.intitule, f.statut_de_poste, f.responsable_hierarchique,
        f.type_metier, f.lieu_mission, f.rythme, f.fourchette_salaire, f.description,
        org.nom AS organisation_nom, org.siren, org.type, org.siege_social
      FROM Offre_Emploi o
      JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
      JOIN Organisation org ON f.siren = org.siren
      WHERE org.siren = ?
    `;
    db.query(sql, [siren], (err, results) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération des offres de l'organisation.",
          err
        );
        callback([]);
      } else {
        for (const offre of results) {
          offre.lieu_mission = JSON.parse(offre.lieu_mission);
        }
        if (results.length === 0) return callback(null);
        else callback(results);
      }
    });
  },
  readAllByOrganisationValide: (siren, callback) => {
    const sql = `SELECT 
      o.numero, o.etat, o.date_validite, o.indication, o.nb_pieces_demandees,
      f.id_fiche, f.intitule, f.statut_de_poste, f.responsable_hierarchique,
      f.type_metier, f.lieu_mission, f.rythme, f.fourchette_salaire, f.description,
      org.nom AS organisation_nom, org.siren, org.type, org.siege_social
      FROM Offre_Emploi o
      JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
      JOIN Organisation org ON f.siren = org.siren
      WHERE org.siren = ?
        AND o.date_validite >= CURDATE();
    `;
    db.query(sql, [siren], (err, results) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération des offres de l'organisation.",
          err
        );
        callback([]);
      } else {
        for (const offre of results) {
          offre.lieu_mission = JSON.parse(offre.lieu_mission);
        }
        if (results.length === 0) return callback(null);
        else callback(results);
      }
    });
  },
  creat: (
    etat,
    date_validite,
    indication,
    nb_pieces_demandees,
    id_fiche,
    callback
  ) => {
    // vérification non null et types cohérents
    if (
      !date_validite ||
      typeof date_validite !== "string" ||
      !nb_pieces_demandees ||
      typeof nb_pieces_demandees !== "number" ||
      !etat ||
      !["non_publiee", "publiee", "expiree"].includes(etat) ||
      !id_fiche ||
      typeof id_fiche !== "number"
    ) {
      return callback(null);
    }

    // vérification sur indication
    if (indication !== null && typeof indication !== "string")
      return callback(null);

    // vérification sur date_validite
    if (date_validite < new Date().toISOString().split("T")[0])
      return callback(null);

    // vérification sur nb_pieces_demandees
    if (nb_pieces_demandees < 0) return callback(null);

    // insertion dans BDD
    let sql_fp = "SELECT * FROM Fiche_Poste WHERE id_fiche = ?";
    db.query(sql_fp, [id_fiche], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);

      let sql =
        "INSERT INTO Offre_Emploi (etat, date_validite, indication, nb_pieces_demandees, id_fiche) VALUES (?, ?, ?, ?, ?)";
      db.query(
        sql,
        [etat, date_validite, indication, nb_pieces_demandees, id_fiche],
        (err, results) => {
          if (err) throw err;
          callback(results.insertId);
        }
      );
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments d'Offre_Emploi en clé
  update: (numero, dictUpdate, callback) => {
    // vérification si l'offre existe
    db.query(
      "SELECT * FROM Offre_Emploi WHERE numero = ?",
      [numero],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dictUpdate est du bon format
        const champsValides = [
          "etat",
          "date_validite",
          "indication",
          "nb_pieces_demandees",
        ];
        const keyslist = Object.keys(dictUpdate);
        if (!keyslist.every((k) => champsValides.includes(k)))
          return callback(null);
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(([_, valeur]) => valeur !== null)
        );

        if (Object.keys(nvdict).length !== 0) {
          // vérification si etat est un string
          if (
            "etat" in nvdict &&
            !["non_publiee", "publiee", "expiree"].includes(nvdict.etat)
          )
            return callback(null);

          // vérification si date_validite est dans le bon format
          if ("date_validite" in nvdict) {
            if (typeof nvdict.date_validite !== "string") return callback(null);
            if (nvdict.date_validite < new Date().toISOString().split("T")[0])
              return callback(null);
          }

          // vérification si indication est dans le bon format
          if ("indication" in nvdict && typeof nvdict.indication !== "string")
            return callback(null);

          // vérification si nb_pieces_demandees est dans le bon format
          if ("nb_pieces_demandees" in nvdict) {
            if (typeof nvdict.nb_pieces_demandees !== "number")
              return callback(null);
            if (nvdict.nb_pieces_demandees < 0) return callback(null);
          }

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Offre_Emploi SET ${clause} WHERE numero = ?`;
          db.query(sql, [...values, numero], (err, results) => {
            if (err) throw err;
            callback(results.affectedRows);
          });
        }
      }
    );
  },
  delete: (numero, callback) => {
    // vérification si l'offre d'emploi existe
    db.query(
      "SELECT * FROM Offre_Emploi WHERE numero = ?",
      [numero],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Offre_Emploi WHERE numero = ?";
        db.query(sql, [numero], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = offre;
