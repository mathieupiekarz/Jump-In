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
  creat: (
    id_can,
    siren,
    descriptionCrO,
    statutCrO,
    nom,
    type,
    siege_social,
    callback
  ) => {
    // vérification non null et types cohérents
    if (
      !id_can ||
      typeof id_can !== "number" ||
      !siren ||
      typeof siren !== "string" ||
      !descriptionCrO ||
      typeof descriptionCrO !== "string" ||
      !statutCrO ||
      !["validee", "refusee", "en_attente"].includes(statutCrO) ||
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
      ].includes(type)
    ) {
      return callback(null);
    }
    // vérification que le json siege social est dans le bon format
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

    // Vérifier que le candidat existe
    const sqlVerifCandidat = "SELECT 1 FROM Candidat WHERE id_can = ?";
    db.query(sqlVerifCandidat, [id_can], (err, resCandidat) => {
      if (err) throw err;
      if (resCandidat.length === 0) return callback(null);

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
            "INSERT INTO DemandeCreationOrganisation (id_can, siren, descriptionCrO, dateDemandeCrO, statutCrO, nom, type, siege_social) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
          const dateDemandeCrO = new Date().toISOString().split("T")[0];
          db.query(
            sql,
            [
              id_can,
              siren,
              descriptionCrO,
              dateDemandeCrO,
              statutCrO,
              nom,
              type,
              JSON.stringify(siege_social),
            ],
            (err, results) => {
              if (err) throw err;
              callback(results.insertId);
            }
          );
        });
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

        // vérification si dictUpdate est du bon format
        const champsValides = [
          "descriptionCrO",
          "statutCrO",
          "nom",
          "type",
          "siege_social",
        ];
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

        // vérification si descriptionCrO est un string
        if ("descriptionCrO" in nv && typeof nv.descriptionCrO !== "string")
          return callback(null);

        // vérification si statutCrO est dans le bon format
        if (
          "statutCrO" in nv &&
          !["inactive", "en_attente", "active"].includes(nv.statutCrO)
        )
          return callback(null);

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
        const updates = [];
        const params = [];
        if ("descriptionCrO" in nv) {
          updates.push("descriptionCrO = ?");
          params.push(nv.descriptionCrO);
        }
        if ("statutCrO" in nv) {
          updates.push("statutCrO = ?");
          params.push(nv.statutCrO);
        }
        if ("nom" in nv) {
          updates.push("nom = ?");
          params.push(nv.nom);
        }
        if ("type" in nv) {
          updates.push("type = ?");
          params.push(nv.type);
        }
        if ("siege_social" in nv) {
          // fusionne l'existant et la partie modifiée
          updates.push("siege_social = JSON_MERGE_PATCH(siege_social, ?)");
          params.push(JSON.stringify(nv.siege_social));
        }

        // mise à jour de la BDD
        const sql = `UPDATE DemandeCreationOrganisation SET ${updates.join(
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
