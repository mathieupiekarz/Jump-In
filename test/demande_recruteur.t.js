const DB = require("../model/db.js");
const demandeR = require("../model/demande_recruteur.js");

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
  test("read demandeR", (done) => {
    demandeR.read(1, "123456789", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].statutDR).toBe("en_attente");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall demandeR", (done) => {
    demandeR.readall((resultat) => {
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
  test("create demandeR", (done) => {
    demandeR.creat(
      9,
      "121212121",
      "demande recruteur pour APPLE",
      "en_attente",
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
  test("update demandeR", (done) => {
    var dico = {
      descriptionDR: "aimerait boire du Ricard",
      statutDR: "refusee",
    };
    demandeR.update(9, "123456789", "123456789", dico, (resultat) => {
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
  test("delete demandeR", (done) => {
    demandeR.delete(1, "939393931", (resultat) => {
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
