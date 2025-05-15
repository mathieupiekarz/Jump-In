const DB = require("../model/db.js");
const demandeChO = require("../model/demande_changer_organisation.js");

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
  test("read demandeChO", (done) => {
    demandeChO.read(1, "121212121", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].statutChO).toBe("en_attente");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall demandeChO", (done) => {
    demandeChO.readall((resultat) => {
      try {
        console.log(resultat);
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
  test("create demandeChO", (done) => {
    demandeChO.creat(
      1,
      "121212121",
      "demande de rejoindre Apple",
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
  test("update demandeChO", (done) => {
    var dico = {
      descriptionChO: "voudrait rejoindre microsoft",
      statutChO: null,
    };
    demandeChO.update(1, "123456788", "123456788", dico, (resultat) => {
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
  test("delete demandeChO", (done) => {
    demandeChO.delete(1, "123456789", (resultat) => {
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
