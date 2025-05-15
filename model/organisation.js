var db = require("./db.js");

const organisation = {
  read: (siren, callback) => {
    let sql = "SELECT * FROM Organisation WHERE siren = ?";
    db.query(sql, [siren], (err, results) => {
      if (err) throw err;
      if (results.lenght === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Organisation", (err, results) => {
      if (err) throw err;
      if (results.lenght === 0) return callback(null);
      callback(results);
    });
  },
  creat: (siren, nom, type, siege_social, statut, callback) => {
    // vérification non null et types cohérents
    if (
      !siren ||
      typeof siren !== "string" ||
      !nom ||
      typeof nom !== "string" ||
      !type ||
      ![
        "association",
        "EURL",
        "SA",
        "SAS",
        "SASU",
        "ONG",
        "SARL",
        "SNC",
        "SCS",
        "SCA",
        "SCI",
        "SCP",
        "SCM",
        "SCEA",
        "SCCV",
        "SCPa",
        "EARL",
        "GAEC",
        "SCIC",
        "SCOP",
        "GIE",
        "GEIE",
        "GE",
      ].includes(type) ||
      !statut ||
      !["inactive", "en_cours", "active"].includes(statut)
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

    // vérification du json siege_social
    const champsValides = [
      "nom",
      "adresse",
      "complement",
      "code_postal",
      "ville",
      "pays",
    ];
    const keylist = Object.keys(siege_social);
    if (!keylist.every((k) => champsValides.includes(k))) return callback(null);
    const valueslist = Object.values(siege_social);
    if (
      typeof valueslist[0] !== "string" ||
      typeof valueslist[1] !== "string" ||
      (typeof valueslist[2] !== "string" && valueslist[2] !== null) ||
      typeof valueslist[3] !== "string" ||
      typeof valueslist[4] !== "string" ||
      typeof valueslist[5] !== "string"
    )
      return callback(null);

    // vérification si une Organisation existante a déjà le même siren
    organisation.read(siren, (result) => {
      if (result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO Organisation (siren, nom, type, siege_social, statut) VALUES (?, ?, ?, ?, ?)";
        db.query(
          sql,
          [siren, nom, type, JSON.stringify(siege_social), statut],
          (err, results) => {
            if (err) throw err;
            callback(results.insertId);
          }
        );
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments d'Organisation en clé
  update: (siren, dictUpdate, callback) => {
    // vérification si l'organisation existe
    db.query(
      "SELECT * FROM Organisation WHERE siren = ?",
      [siren],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);

        // vérification si dictUpdate est du bon format
        const champsValides = ["nom", "type", "siege_social", "statut"];
        const keyslist = Object.keys(dictUpdate);
        if (!keyslist.every((k) => champsValides.includes(k)))
          return callback(null);
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(([_, valeur]) => valeur !== null)
        );

        if (Object.keys(nvdict).length !== 0) {
          // vérification si nom est un string
          if ("nom" in nvdict && typeof nvdict.nom !== "string")
            return callback(null);

          // vérification si type est dans le bon format
          if (
            "type" in nvdict &&
            ![
              "association",
              "EURL",
              "SA",
              "SAS",
              "SASU",
              "ONG",
              "SARL",
              "SNC",
              "SCS",
              "SCA",
              "SCI",
              "SCP",
              "SCM",
              "SCEA",
              "SCCV",
              "SCPa",
              "EARL",
              "GAEC",
              "SCIC",
              "SCOP",
              "GIE",
              "GEIE",
              "GE",
            ].includes(nvdict.type)
          )
            return callback(null);

          // vérification si siege_social est dans le bon format
          if ("siege_social" in nvdict) {
            const champsValides = [
              "nom",
              "adresse",
              "complement",
              "code_postal",
              "ville",
              "pays",
            ];
            const keylist = Object.keys(nvdict.siege_social);
            if (!keylist.every((k) => champsValides.includes(k)))
              return callback(null);
            const valueslist = Object.values(nvdict.siege_social);
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

          // vérification si statut est dans le bon format
          if (
            "statut" in nvdict &&
            !["inactive", "en_cours", "active"].includes(nvdict.statut)
          )
            return callback(null);

          // mise à jour de la BDD
          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Organisation SET ${clause} WHERE siren = ?`;
          db.query(sql, [...values, siren], (err, results) => {
            if (err) throw err;
            callback(results.affectedRows);
          });
        }
      }
    );
  },
  delete: (siren, callback) => {
    // vérification si l'organisation existe
    db.query(
      "SELECT * FROM Organisation WHERE siren = ?",
      [siren],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Organisation WHERE siren = ?";
        db.query(sql, [siren], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
};

module.exports = organisation;
