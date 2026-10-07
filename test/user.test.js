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
        if (resultat === null) done();
        else {
          expect(resultat[0].nom).toBe("navarre");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall user", (done) => {
    candidat.readall((resultat) => {
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
  test("arevalide user", async () => {
    const isValid = await candidat.areValide("AB123test@?test");
    expect(isValid).toBe(true);
  });
  test("create user", (done) => {
    candidat.creat(
      "jean.dupont@gmail.com",
      "AB123test@?test",
      "dupont",
      "jean",
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
      email: "alex.durand@example.com",
      mdp: "ttAA11#*izgoaajivza",
      nom: "durand",
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
      "paul.bernard@outlook.fr",
      "AB123test@?test",
      (resultat) => {
        try {
          if (resultat === null) done();
          else {
            expect(resultat[0].email).toBe("paul.bernard@outlook.fr");
            done();
          }
        } catch (err) {
          done(err);
        }
      }
    );
  });
});
