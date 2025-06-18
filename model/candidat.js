var db = require("./db.js");

const candidat = {
  read: (email, callback) => {
    let sql = "SELECT * FROM Candidat WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readById: (id_can, callback) => {
    let sql = "SELECT * FROM Candidat WHERE id_can = ?";
    db.query(sql, [id_can], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Candidat", (err, results) => {
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
  creat: async (email, mdp, nom, prenom, num, statut, callback) => {
    // vérification non null et types cohérents
    if (
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

    // vérification du format du numéro de téléphone
    let numSansEspace = num.replace(/\s+/g, "");
    numValide = /^\+33\d{9}$/.test(numSansEspace);
    if (!numValide) return callback(null);

    /*
    // vérification de la composition du mot de passe
    const isValide = await candidat.areValide(mdp);
    if (!isValide) {
      return callback(null);
    }*/

    // vérification du format de l'email
    regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return callback(null);
    }

    // vérification si un candidat existant a déjà le même email
    candidat.read(email, (result) => {
      if (result && result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO Candidat (email, mdp, nom, prenom, numero_telephone, date_creation, statut) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const dateC = new Date().toISOString().split("T")[0];
        db.query(
          sql,
          [email, mdp, nom, prenom, numSansEspace, dateC, statut],
          (err, results) => {
            if (err) {
              console.error(
                "Erreur lors de la récupération des candidatures:",
                err
              );
              return callback(null);
            }
            callback(results.insertId);
          }
        );
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de Candidat en clé
  update: (id_can, dictUpdate, callback) => {
    // vérification si le candidat existe
    db.query(
      "SELECT * FROM Candidat WHERE id_can = ?",
      [id_can],
      async (err, results) => {
        if (err) throw err;
        if (results.length === 0) return callback(null);
        // vérification si dict est du bon format
        const champsValides = [
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

          // vérification si le nouveau statut est bien compris entre 'actif' et 'inactif'
          if (
            "statut" in nvdict &&
            !["actif", "inactif"].includes(nvdict.statut)
          )
            return callback(null);

          /*
          // vérification si le nouveau mdp est dans le bon format
          if ("mdp" in nvdict) {
            const isValide = await candidat.areValide(nvdict.mdp);
            if (!isValide) {
              return callback(null);
            }
          }*/

          // vérification si le nouveau téléphone est dans le bon format
          if ("numero_telephone" in nvdict) {
            nvdict.numero_telephone = nvdict.numero_telephone.replace(
              /\s+/g,
              ""
            );
            const numValide = /^\+33\d{9}$/.test(nvdict.numero_telephone);
            if (!numValide) return callback(null);
          }

          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Candidat SET ${clause} WHERE id_can = ?`;

          // vérification si le nouvel email existe déjà
          if ("email" in nvdict) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(nvdict.email)) return callback(null);

            candidat.read(nvdict.email, (result) => {
              if (result && result.length > 1) return callback(null);
              // mise à jour de la BDD
              db.query(sql, [...values, id_can], (err, results) => {
                if (err) throw err;
                callback(results.affectedRows);
              });
            });
          } else {
            // mise à jour de la BDD
            db.query(sql, [...values, id_can], (err, results) => {
              if (err) throw err;
              callback(results.affectedRows);
            });
          }
        }
      }
    );
  },
  delete: (id_can, callback) => {
    // vérification si le candidat existe
    db.query(
      "SELECT * FROM Candidat WHERE id_can = ?",
      [id_can],
      (err, results) => {
        if (err) throw err;

        //vérification qu'il existe un candidat avec cet id
        if (results.length === 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Candidat WHERE id_can = ?";
        db.query(sql, [id_can], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
  // vérification si le candidat existe
  connect: (email, mdp, callback) => {
    let sql = "SELECT email FROM Candidat WHERE email = ? AND mdp = ?";
    db.query(sql, [email, mdp], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
};

module.exports = candidat;
