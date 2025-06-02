const DB = require("../model/db.js");
const admin = require("../model/administrateur.js");

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
  test("read admin", (done) => {
    admin.read("barrau.12@non.com", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].prenom).toBe("maxence");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall admin", (done) => {
    admin.readall((resultat) => {
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
  test("arevalide admin", async () => {
    const isValid = await admin.areValide("AB123test@?test");
    expect(isValid).toBe(true);
  });
  test("create admin", (done) => {
    admin.creat(
      "antoine.trouve@oui.com",
      "AB123test@?test",
      "trouve",
      "antoire",
      "+33611121314",
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
  test("update admin", (done) => {
    var dico = {
      email: "mathieu.12@oui.fr",
      mdp: "ttAA11#*izgoaajivza",
      nom: "piekarz",
      prenom: "mathieu",
      numero_telephone: "+33667654578",
      statut: "inactif",
    };
    admin.update(1, dico, (resultat) => {
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
  test("delete admin", (done) => {
    admin.delete(5, (resultat) => {
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
  test("connexion admin", (done) => {
    admin.connect("mathieu.12@oui.fr", "ttAA11#*izgoaajivza", (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].email).toBe("mathieu.12@oui.fr");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
});
