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
      if (i % 2 === 1) digit *= 2;
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
        const nv = Object.entries(dictUpdate)
          .filter(([k, v]) => champsValides.includes(k) && v !== null)
          .reduce((o, [k, v]) => {
            o[k] = v;
            return o;
          }, {});

        // si rien à mettre à jour, on renvoie 0 lignes affectées
        if (Object.keys(nv).length === 0) {
          return callback(null, 0);
        }

        // vérification si nom est un string
        if ("nom" in nv && typeof nv.nom !== "string") return callback(null);

        // vérification si type est dans le bon format
        if (
          "type" in nv &&
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
          ].includes(nv.type)
        )
          return callback(null);

        // vérification si siege_social est dans le bon format
        if ("siege_social" in nv) {
          if (typeof nv.siege_social !== "object") {
            return callback(null);
          }
          const champsSiege = [
            "nom",
            "adresse",
            "complement",
            "code_postal",
            "ville",
            "pays",
          ];
          const clefs = Object.keys(nv.siege_social);
          // chaque clé doit être autorisée
          if (!clefs.every((k) => champsSiege.includes(k))) {
            return callback(null);
          }
          // types : nom, adresse, code_postal, ville, pays => string ; complement => string ou null
          const vals = nv.siege_social;
          if (
            typeof vals.nom !== "string" ||
            typeof vals.adresse !== "string" ||
            !(
              typeof vals.complement === "string" || vals.complement === null
            ) ||
            typeof vals.code_postal !== "string" ||
            typeof vals.ville !== "string" ||
            typeof vals.pays !== "string"
          ) {
            return callback(null);
          }
        }

        // Construction dynamique de la requête
        if (
          "statut" in nv &&
          !["inactive", "en_cours", "active"].includes(nv.statut)
        )
          return callback(null);

        // mise à jour de la BDD
        const updates = [];
        const params = [];

        if ("nom" in nv) {
          updates.push("nom = ?");
          params.push(nv.nom);
        }
        if ("type" in nv) {
          updates.push("type = ?");
          params.push(nv.type);
        }
        if ("statut" in nv) {
          updates.push("statut = ?");
          params.push(nv.statut);
        }
        if ("siege_social" in nv) {
          // fusionne l'existant et la partie modifiée
          updates.push("siege_social = JSON_MERGE_PATCH(siege_social, ?)");
          params.push(JSON.stringify(nv.siege_social));
        }
        console.log(params);

        // vérification si statut est dans le bon format
        const sql = `UPDATE Organisation SET ${updates.join(
          ", "
        )} WHERE siren = ?`;
        db.query(sql, [...params, siren], (err, result) => {
          if (err) throw err;
          // affectedRows = nombre de lignes modifiées
          callback(result.affectedRows);
        });
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
