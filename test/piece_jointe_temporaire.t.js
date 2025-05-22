const DB = require("../model/db.js");
const pjt = require("../model/piece_jointe_temporaire.js");

describe("Model Tests", () => {
  beforeAll(() => {
    // instructions à executer avant le lancement des tests
  });
  afterAll((done) => {
    function callback(err) {
      if (err) done(err);
      else done();
    }
    DB.end(callback);
  });
  test("read Piece Jointe Temporaire", (done) => {
    pjt.read("http://localhost:3000/users/candidaturelist", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].type).toBe("xlsx");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall Piece Jointe Temporaire", (done) => {
    pjt.readall((resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat.length > 0).toBe(true);
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("create Piece Jointe Temporaire", (done) => {
    // le num_OE est 1988 est volontairement faux pour éviter de créer à chaque fois une nouvelle fiche de poste
    pjt.creat(
      "http://localhost:3000/uploads/ConventionBenoit",
      "Convention Benoit",
      "pdf",
      8,
      1988,
      (resultat) => {
        try {
          if (resultat === null) {
            done();
          } else {
            expect(typeof resultat).toBe("number");
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });
  test("update Piece Jointe Temporaire", (done) => {
    var dico = {
      nom: "Convention de Benoit",
      type: "jpeg",
    };
    pjt.update(
      "http://localhost:3000/uploads/ConventionBenoit",
      dico,
      (resultat) => {
        try {
          if (resultat === null) done();
          else {
            expect([0, 1]).toContain(resultat);
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });
  test("delete Piece Jointe Durable", (done) => {
    // numero "http/test" inexistant pris exrès pour ne rien supprimer
    pjt.delete("http/test", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect([0, 1]).toContain(resultat);
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
});
