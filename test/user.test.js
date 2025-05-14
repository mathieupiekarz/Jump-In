const DB = require("../model/db.js");
const candidat = require("../model/candidat.js");

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
  test("read user", (done) => {
    candidat.read("oui.oui@gmail.com", (resultat) => {
      try {
        expect(resultat[0].nom).toBe("navarre");
        done();
      } catch (err) {
        done(err);
      }
    });
  });
  test("arevalide user", async () => {
    const isValid = await candidat.areValide("AB123test@?test");
    expect(isValid).toBe(true);
  });
  test("create user", (done) => {
    candidat.creat(
      "pierre.liquois@gmail.com",
      "AB123test@?test",
      "liquois",
      "pierre",
      "+33654676564",
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
});
