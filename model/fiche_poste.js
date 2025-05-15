var db = require("./db.js");

const fp = {
  read: (id_fiche, callback) => {
    let sql = "SELECT * FROM Fiche_Poste WHERE id_fiche = ?";
    db.query(sql, [id_fiche], (err, results) => {
      if (err) throw err;
      console.log("oui");
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Fiche_Poste", (err, results) => {
      if (err) throw err;
      callback(results);
    });
  },
  readByOrganisation: (siren, callback) => {
    let sql = `
      SELECT fp.*, org.nom AS organisation_nom 
      FROM Fiche_Poste fp
      JOIN Organisation org ON fp.siren = org.siren
      WHERE fp.siren = ?
    `;
    db.query(sql, [siren], (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération des fiches de poste:", err);
        callback([]);
      } else {
        callback(results);
      }
    });
  },
  creat: (
    intitule,
    statut_de_poste,
    responsable_hierarchique,
    type_metier,
    lieu_mission,
    rythme,
    fourchette_salaire,
    description,
    siren,
    callback
  ) => {
    // vérification non null et types cohérents
    if (
      !intitule ||
      typeof intitule !== "string" ||
      !statut_de_poste ||
      typeof statut_de_poste !== "string" ||
      !responsable_hierarchique ||
      typeof responsable_hierarchique !== "string" ||
      !type_metier ||
      typeof type_metier !== "string" ||
      !rythme ||
      typeof rythme !== "string" ||
      !fourchette_salaire ||
      typeof fourchette_salaire !== "string" ||
      !description ||
      typeof description !== "string" ||
      !description ||
      typeof description !== "string"
    ) {
      return callback(null);
    }

    //vérification sur le format du siren + algo de Luhn pour le dernier chiffre
    if (!/^\d{9}$/.test(siren)) return callback(null);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(siren[i], 10);
      if (i % 2 === 0) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    if (sum % 10 !== 0) return callback(null);

    console.log("oui");

    // vérification du json lieu_mission
    const champsValides = [
      "nom",
      "adresse",
      "complement",
      "code_postal",
      "ville",
      "pays",
    ];
    const keylist = Object.keys(lieu_mission);
    if (!keylist.every((k) => champsValides.includes(k))) return callback(null);
    const valueslist = Object.values(lieu_mission);
    if (
      typeof valueslist[0] !== "string" ||
      typeof valueslist[1] !== "string" ||
      (typeof valueslist[2] !== "string" && valueslist[2] !== null) ||
      typeof valueslist[3] !== "string" ||
      typeof valueslist[4] !== "string" ||
      typeof valueslist[5] !== "string"
    )
      return callback(null);

    // insertion dans BDD
    let sql =
      "INSERT INTO Fiche_Poste (intitule, statut_de_poste, responsable_hierarchique, type_metier, lieu_mission, rythme, fourchette_salaire, description, siren) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [
        intitule,
        statut_de_poste,
        responsable_hierarchique,
        type_metier,
        JSON.stringify(lieu_mission),
        rythme,
        fourchette_salaire,
        description,
        siren,
      ],
      (err, results) => {
        if (err) throw err;
        callback(results.insertId);
      }
    );
  },
  // prend en argument un dictionnaire qui contient tous les arguments de Fiche_Poste en clé
  update: (id_fiche, dictUpdate, callback) => {
    // vérification si la fiche_poste existe
    db.query(
      "SELECT * FROM Fiche_Poste WHERE id_fiche = ?",
      [id_fiche],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dictUpdate est du bon format
        const champsValides = [
          "intitule",
          "statut_de_poste",
          "responsable_hierarchique",
          "type_metier",
          "lieu_mission",
          "rythme",
          "fourchette_salaire",
          "description",
        ];
        const keyslist = Object.keys(dictUpdate);
        if (!keyslist.every((k) => champsValides.includes(k)))
          return callback(null);
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(([_, valeur]) => valeur !== null)
        );

        if (Object.keys(nvdict).length !== 0) {
          // vérification si intitule est un string
          if ("intitule" in nvdict && typeof nvdict.intitule !== "string")
            return callback(null);

          // vérification si statut_de_poste est un string
          if (
            "statut_de_poste" in nvdict &&
            typeof nvdict.statut_de_poste !== "string"
          )
            return callback(null);

          // vérification si responsable_hierarchique est un string
          if (
            "responsable_hierarchique" in nvdict &&
            typeof nvdict.responsable_hierarchique !== "string"
          )
            return callback(null);

          // vérification si type_metier est un string
          if ("type_metier" in nvdict && typeof nvdict.type_metier !== "string")
            return callback(null);

          // vérification si rythme est un string
          if ("rythme" in nvdict && typeof nvdict.rythme !== "string")
            return callback(null);

          // vérification si fourchette_salaire est un string
          if (
            "fourchette_salaire" in nvdict &&
            typeof nvdict.fourchette_salaire !== "string"
          )
            return callback(null);

          // vérification si description est un string
          if ("description" in nvdict && typeof nvdict.description !== "string")
            return callback(null);

          // vérification si lieu_mission est dans le bon format
          if ("lieu_mission" in nvdict) {
            const champsValides = [
              "nom",
              "adresse",
              "complement",
              "code_postal",
              "ville",
              "pays",
            ];
            const keylist = Object.keys(nvdict.lieu_mission);
            if (!keylist.every((k) => champsValides.includes(k)))
              return callback(null);
            const valueslist = Object.values(nvdict.lieu_mission);
            if (
              typeof valueslist[0] !== "string" ||
              typeof valueslist[1] !== "string" ||
              (typeof valueslist[2] !== "string" && valueslist[2] !== null) ||
              typeof valueslist[3] !== "string" ||
              typeof valueslist[4] !== "string" ||
              typeof valueslist[5] !== "string"
            )
              return callback(null);
          }

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Fiche_Poste SET ${clause} WHERE id_fiche = ?`;
          db.query(sql, [...values, id_fiche], (err, results) => {
            if (err) throw err;
            callback(results.affectedRows);
          });
        }
      }
    );
  },
  delete: (id_fiche, callback) => {
    // vérification si la fiche_poste existe
    db.query(
      "SELECT * FROM Fiche_Poste WHERE id_fiche = ?",
      [id_fiche],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Fiche_Poste WHERE id_fiche = ?";
        db.query(sql, [id_fiche], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = fp;
