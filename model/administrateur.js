var db = require("./db.js");

const admin = {
  read: (email, callback) => {
    let sql = "SELECT * FROM Administrateur WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  readall: (callback) => {
    db.query("SELECT * FROM Administrateur", (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
  areValide: (pwd) => {
    // vérification de la composition du mot de passe
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

    // vérification de la composition du mot de passe
    const isValide = await admin.areValide(mdp);
    if (!isValide) {
      return callback(null);
    }

    // vérification du format du numéro de téléphone
    const numValide = /^\+33\d{9}$/.test(num);
    if (!numValide) return callback(null);

    // vérification du format de l'email
    regex = /^[^@.\s]+\.{1}[^@.\s]+@([^@.\s]+\.)+[^@.\s]+$/;
    if (!regex.test(email)) return callback(null);

    // vérification si un admin existant a déjà le même email
    admin.read(email, (result) => {
      if (result && result.length > 0) return callback(null);
      else {
        let sql =
          "INSERT INTO Administrateur (email, mdp, nom, prenom, numero_telephone, date_creation, statut) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const dateC = new Date().toISOString().split("T")[0];
        db.query(
          sql,
          [email, mdp, nom, prenom, num, dateC, statut],
          (err, results) => {
            if (err) throw err;
            callback(results.insertId);
          }
        );
      }
    });
  },
  // prend en argument un dictionnaire qui contient tous les arguments de Administrateur en clé
  update: (id_admin, dictUpdate, callback) => {
    // vérification si l'admin existe
    db.query(
      "SELECT * FROM Administrateur WHERE id_admin = ?",
      [id_admin],
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

          // vérification si le nouveau mdp est dans le bon format
          if ("mdp" in nvdict) {
            const isValide = await admin.areValide(nvdict.mdp);
            if (!isValide) {
              return callback(null);
            }
          }

          // vérification si le nouveau téléphone est dans le bon format
          if ("numero_telephone" in nvdict) {
            const numValide = /^\+33\d{9}$/.test(nvdict.numero_telephone);
            if (!numValide) return callback(null);
          }

          const champs = Object.keys(nvdict);
          const values = Object.values(nvdict);
          const clause = champs.map((k) => `${k} = ?`).join(", ");
          const sql = `UPDATE Administrateur SET ${clause} WHERE id_admin = ?`;

          // vérification si le nouvel email existe déjà
          if ("email" in nvdict) {
            const regex = /^[^@.\s]+\.{1}[^@.\s]+@([^@.\s]+\.)+[^@.\s]+$/;
            if (!regex.test(nvdict.email)) return callback(null);

            admin.read(nvdict.email, (result) => {
              if (result && result.length > 1) return callback(null);
              // mise à jour de la BDD
              db.query(sql, [...values, id_admin], (err, results) => {
                if (err) throw err;
                callback(results.affectedRows);
              });
            });
          } else {
            // mise à jour de la BDD
            db.query(sql, [...values, id_admin], (err, results) => {
              if (err) throw err;
              callback(results.affectedRows);
            });
          }
        }
      }
    );
  },
  delete: (id_admin, callback) => {
    // vérification si l'admin existe
    db.query(
      "SELECT * FROM Administrateur WHERE id_admin = ?",
      [id_admin],
      (err, results) => {
        if (err) throw err;

        //vérification qu'il existe un admin avec cet id
        if (results.length === 0) return callback(null);

        // suppression
        let sql = "DELETE FROM Administrateur WHERE id_admin = ?";
        db.query(sql, [id_admin], (err, results) => {
          if (err) throw err;
          callback(results.affectedRows);
        });
      }
    );
  },
  // vérification si l'admin existe
  connect: (email, mdp, callback) => {
    let sql = "SELECT email FROM Administrateur WHERE email = ? AND mdp = ?";
    db.query(sql, [email, mdp], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return callback(null);
      callback(results);
    });
  },
};

module.exports = admin;
