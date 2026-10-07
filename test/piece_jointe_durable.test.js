const DB = require("../model/db.js");
const pjd = require("../model/piece_jointe_durable.js");

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
  test("read Piece Jointe Durable", (done) => {
    pjd.read("file_1749837619560.pdf", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].type).toBe("pdf");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall Piece Jointe Durable", (done) => {
    pjd.readall((resultat) => {
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
  test("create Piece Jointe Durable", (done) => {
    // l'id_fiche est 198 est volontairement faux pour éviter de créer à chaque fois une nouvelle fiche de poste
    pjd.creat("file_1749837619560.pdf", "pdf", 19, (resultat) => {
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
    });
  });
  /*
  test("update Piece Jointe Durable", (done) => {
    var dico = {
      nom: "Lettre Motivation de Benoit",
      type: "jpeg",
    };
    pjd.update("http://localhost:3000/uploads/LMbenoit", dico, (resultat) => {
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
  test("delete Piece Jointe Durable", (done) => {
    // numero "http/test" inexistant pris exrès pour ne rien supprimer
    pjd.delete("http/test", (resultat) => {
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
  });*/
});
