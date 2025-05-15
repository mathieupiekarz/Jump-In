const DB = require("../model/db.js");
const fp = require("../model/fiche_poste.js");

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
  test("read FichePoste", (done) => {
    fp.read(1, (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].statut_de_poste).toBe("cadre");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall Fiche Poste", (done) => {
    fp.readall((resultat) => {
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
  test("create Fiche Poste", (done) => {
    fp.creat(
      "commercial",
      "salarié",
      "Navarre Titouan",
      "marketing",
      {
        nom: "Building 1",
        adresse: "4 rue des ibis bleus",
        complement: null,
        code_postal: "13",
        ville: "Marseille",
        pays: "France",
      },
      "10h/j",
      "1500e net",
      "recherche d'un commercial pour vendre du Ricard",
      "123456789",
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
  /*
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
  */
});
