var db = require("./db.js");

const recruteur = {
  read: (email, callback) => {
    let sql = "SELECT * FROM Recruteur WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readById: (id_rec, callback) => {
    let sql = "SELECT * FROM Recruteur WHERE id_rec = ?";
    db.query(sql, [id_rec], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Recruteur", (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  areValide: (pwd) => {
    return new Promise((resolve) => {
      // vérification de la composition du mot de passe
      const regex =
        /^(?=(?:.*[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÙ]){2,})(?=(?:.*[a-zàâäçéèêëîïôöûüùÿ]){2,})(?=(?:.*\d){2,})(?=(?:.*[!?@\$%&\*\+=\-_.,;:\/\\|^~#()[\]{}<>'"`€£µ§°¤]){2,})[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÙa-zàâäçéèêëîïôöûüùÿ\d!?@\$%&\*\+=\-_.,;:\/\\|^~#()[\]{}<>'"`€£µ§°¤]{12,}$/;
      resolve(regex.test(pwd));
    });
  },
  creat: async (siren, email, mdp, nom, prenom, num, statut, callback) => {
    // vérification non null et types cohérents
    if (
      !siren ||
      typeof siren !== "string" ||
      !email ||
      typeof email !== "string" ||
      !mdp ||
      typeof mdp !== "string" ||
      !nom ||
      typeof nom !== "string" ||
      !prenom ||
      typeof prenom !== "string" ||
      !num ||
      typeof num !== "string" ||
      !statut ||
      !["actif", "inactif"].includes(statut)
    ) {
      return callback(null);
    }

    //vérification sur le format du siren + algo de Luhn pour le dernier chiffre
    if (!/^\d{9}$/.test(siren)) {
      return callback(null);
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(siren[i], 10);
      if (i % 2 === 1) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    if (sum % 10 !== 0) {
      return callback(null);
    }

    // vérification de la composition du mot de passe
    const isValide = await recruteur.areValide(mdp);
    if (!isValide) {
      return callback(null);
    }

    // vérification du format du numéro de téléphone
    let numValide = num.replace(/\s+/g, "");
    numValide = /^\+33\d{9}$/.test(numValide);
    if (!numValide) return callback(null);

    // vérification du format de l'email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return callback(null);
    }

    // vérification si l'organisation existe
    let sql_siren = "SELECT * FROM Organisation WHERE siren = ?";
    db.query(sql_siren, [siren], (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        console.log("Organisation non trouvée avec le SIREN:", siren);
        return callback(null);
      }

      // vérification si un recruteur existant a déjà le même email
      recruteur.read(email, (result) => {
        if (result && result.length > 0) {
          console.log("Un recruteur avec cet email existe déjà:", email);
          return callback(null);
        } else {
          let sql =
            "INSERT INTO Recruteur (siren, email, mdp, nom, prenom, numero_telephone, date_creation, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
          const dateC = new Date().toISOString().split("T")[0];
          console.log("Tentative de création du recruteur avec les données:", {
            siren,
            email,
            nom,
            prenom,
            num,
            dateC,
            statut,
          });
          db.query(
            sql,
            [siren, email, mdp, nom, prenom, numValide, dateC, statut],
            (err, results) => {
              if (err) {
                console.error(
                  "Erreur MySQL lors de la création du recruteur:",
                  err
                );
                throw err;
              }
              console.log("Recruteur créé avec succès, ID:", results.insertId);
              callback(results.insertId);
            }
          );
        }
      });
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de Recruteur en clé
  update: (id_rec, dictUpdate, callback) => {
    // vérification si le recruteur existe
    db.query(
      "SELECT * FROM Recruteur WHERE id_rec = ?",
      [id_rec],
      async (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);
        // vérification si dict est du bon format
        const champsValides = [
          "siren",
          "email",
          "mdp",
          "nom",
          "prenom",
          "numero_telephone",
          "statut",
        ];
        const keyslist = Object.keys(dictUpdate);
        if (!keyslist.every((k) => champsValides.includes(k)))
          return callback(null);
        const nvdict = Object.fromEntries(
          Object.entries(dictUpdate).filter(([_, valeur]) => valeur !== null)
        );

        if (Object.keys(nvdict).length !== 0) {
          // vérification si tous les types sont bien des strings
          const valueslist = Object.values(nvdict);
          if (!valueslist.every((valeur) => typeof valeur === "string"))
            return callback(null);

          //vérification sur le format du siren + algo de Luhn pour le dernier chiffre
          if (!/^\d{9}$/.test(nvdict.siren)) return callback(null);
          let sum = 0;
          for (let i = 0; i < 9; i++) {
            let digit = parseInt(nvdict.siren[i], 10);
            if (i % 2 === 1) digit *= 2;
            if (digit > 9) digit -= 9;
            sum += digit;
          }
          if (sum % 10 !== 0) return callback(null);

          // vérification si le nouveau statut est bien compris entre 'actif' et 'inactif'
          if (
            "statut" in nvdict &&
            !["actif", "inactif"].includes(nvdict.statut)
          )
            return callback(null);

          // vérification si le nouveau mdp est dans le bon format
          if ("mdp" in nvdict) {
            const isValide = await recruteur.areValide(nvdict.mdp);
            if (!isValide) {
              return callback(null);
            }
          }

          nvdict.numero_telephone = nvdict.numero_telephone.replace(/\s+/g, "");
          // vérification si le nouveau téléphone est dans le bon format
          if ("numero_telephone" in nvdict) {
            const numValide = /^\+33\d{9}$/.test(nvdict.numero_telephone);
            if (!numValide) return callback(null);
          }

          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Recruteur SET ${clause} WHERE id_rec = ?`;

          // vérification que l'organisation existe bien
          let sql_siren = "SELECT * FROM Organisation WHERE siren = ?";
          db.query(sql_siren, [nvdict.siren], (err, result) => {
            if (err) throw err;
            if (result === 0) return callback(null);

            // vérification si le nouvel email existe déjà
            if ("email" in nvdict) {
              const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!regex.test(nvdict.email)) return callback(null);

              recruteur.read(nvdict.email, (result) => {
                if (result && result.length > 1) return callback(null);
                // mise à jour de la BDD
                db.query(sql, [...values, id_rec], (err, results) => {
                  if (err) throw err;
                  callback(results.affectedRows);
                });
              });
            } else {
              // mise à jour de la BDD
              db.query(sql, [...values, id_rec], (err, results) => {
                if (err) throw err;
                callback(results.affectedRows);
              });
            }
          });
        }
      }
    );
  },
  delete: (id_rec, callback) => {
    // vérification si le recruteur existe
    db.query(
      "SELECT * FROM Recruteur WHERE id_rec = ?",
      [id_rec],
      (err, results) => {
        if (err) throw err;
        if (results.length == 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Recruteur WHERE id_rec = ?";
        db.query(sql, [id_rec], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
  // vérification si le recruteur existe
  connect: (email, mdp, callback) => {
    let sql = "SELECT email FROM Recruteur WHERE email = ? AND mdp = ?";
    db.query(sql, [email, mdp], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
};

module.exports = recruteur;
