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
    rec.read("pierre.liquois@yahoo.fr", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].nom).toBe("liquois");
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
      "mael.lozach@outlook.fr",
      "AB123test@?test",
      "lozach",
      "mael",
      "+33612121212",
      "inactif",
      (resultat) => {
        try {
          if (resultat === null) {
            done();
          } else {
            console.log(resultat);

            //expect(typeof resultat).toBe("number");
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });
  /*s
  test("update user", (done) => {
    var dico = {
      email: "mathieu.piekarz@outlook.fr",
      mdp: "ttAA11#*izgoaajivza",
      nom: "piekarz",
      prenom: "mathieu",
      numero_telephone: "+33667654578",
      statut: "actif",
    };
    candidat.update(1, dico, (resultat) => {
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
  test("delete user", (done) => {
    candidat.delete(2, (resultat) => {
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
  test("connexion user", (done) => {
    candidat.connect(
      "benoit.demiscault@outlook.fr",
      "AB123test@?test",
      (resultat) => {
        try {
          if (resultat === null) done();
          else {
            expect(resultat[0].email).toBe("benoit.demiscault@outlook.fr");
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });
  */
});
