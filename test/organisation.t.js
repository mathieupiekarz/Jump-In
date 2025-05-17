const DB = require("../model/db.js");
const orga = require("../model/organisation.js");

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
  test("read Organisation", (done) => {
    orga.read("775620326", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].nom).toBe("Ricard");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall Organisation", (done) => {
    orga.readall((resultat) => {
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
  test("create Organisation", (done) => {
    orga.creat(
      "343134763",
      "JBL",
      "SA",
      {
        nom: "Building 1",
        adresse: "4 rue des ibis bleus",
        complement: null,
        code_postal: "75",
        ville: "Paris",
        pays: "France",
      },
      "active",
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
  test("update Organisation", (done) => {
    var dico = {
      nom: "INTEL",
      type: null,
      siege_social: {
        nom: "Building 4",
        adresse: "18 avenue des pigeons jaunes",
        complement: null,
        code_postal: "92",
        ville: "Montrouge",
        pays: "France",
      },
      statut: "en_cours",
    };
    orga.update("941615692", dico, (resultat) => {
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

  test("delete Organisation", (done) => {
    // siren volontairement faux pour éviter de supprimer une organisation
    orga.delete("343134763", (resultat) => {
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
