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
  creat: (id_can, num_OE, callback) => {
    // vérification non null et types cohérents
    if (
      !id_can ||
      typeof id_can !== "int" ||
      !num_OE ||
      typeof num_OE !== "int"
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
