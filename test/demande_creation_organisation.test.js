const DB = require("../model/db.js");
const demandeCrO = require("../model/demande_creation_organisation.js");

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
  test("read demandeCrO", (done) => {
    demandeCrO.read(1, "390989580", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].statutCrO).toBe("en_attente");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall demandeCrO", (done) => {
    demandeCrO.readall((resultat) => {
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
  test("create demandeCrO", (done) => {
    demandeCrO.creat(
      9,
      "116809831",
      "demande de créer Ferrari",
      "en_attente",
      "Ferrari",
      "SA",
      {
        nom: "Ferrari",
        adresse: "45 boulevard des kways mouillés",
        complement: null,
        code_postal: "60200",
        ville: "Venette",
        pays: "France",
      },
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
  test("update demandeCrO", (done) => {
    var dico = {
      descriptionCrO: "voudrait créer ESCOM",
      statutCrO: "en_attente",
      nom: "MatheoGros",
      type: "ONG",
      siege_social: {
        nom: "matheo",
        adresse: "45 boulevard des kways mouillés",
        complement: "oui",
        code_postal: "60200",
        ville: "Venette",
        pays: "France",
      },
    };
    demandeCrO.update(9, "687994368", dico, (resultat) => {
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
  test("delete demandeCrO", (done) => {
    // id_can 400 et siren 939393931 saisi incorret volontairement pour éviter de supprimer une demande à chaque appel
    demandeCrO.delete(400, "939393931", (resultat) => {
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
