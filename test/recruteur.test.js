const DB = require("../model/db.js");
const rec = require("../model/recruteur.js");

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
  test("read recruteur", (done) => {
    rec.read("jean.dupont@yahoo.fr", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].nom).toBe("dupont");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readByIdrecruteur", (done) => {
    rec.readById(1, (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].nom).toBe("dupont");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall recruteur", (done) => {
    rec.readall((resultat) => {
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
  test("arevalide recruteur", async () => {
    const isValid = await rec.areValide("lazoneenpersonne12AB##");
    expect(isValid).toBe(true);
  });
  test("create recruteur", (done) => {
    rec.creat(
      "552100554",
      "claire.martin@outlook.fr",
      "AB123test@?test",
      "martin",
      "claire",
      "+33611111111",
      "actif",
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
  test("update recruteur", (done) => {
    var dico = {
      siren: "732829320",
      email: "gaetan.pireprénom@outlook.fr",
      mdp: "ttAA11#*izgoaajivza",
      nom: "gaetan",
      prenom: "pireprénom",
      numero_telephone: "+33612121212",
      statut: "inactif",
    };
    rec.update(5, dico, (resultat) => {
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
  test("delete recruteur", (done) => {
    // id-rec : 400 volontairement pour éviter de supprimer un recruteur à chaque appel
    rec.delete(400, (resultat) => {
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
  test("connexion recruteur", (done) => {
    rec.connect(
      "jean.dupont@yahoo.fr",
      "lazoneenpersonne12AB##",
      (resultat) => {
        try {
          if (resultat === null) done();
          else {
            expect(resultat[0].email).toBe("jean.dupont@yahoo.fr");
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });
});
