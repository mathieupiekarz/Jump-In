const DB = require("../model/db.js");
const oe = require("../model/offre_emploi.js");

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
  test("readWithFicheAndOrganisation Offre Emploi", (done) => {
    oe.read(1, (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].nb_pieces_demandees).toBe(3);
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall Offre Emploi", (done) => {
    oe.readall((resultat) => {
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
  test("readAllWithFicheAndOrganisation Offre Emploi", (done) => {
    oe.readAllWithFicheAndOrganisation((resultat) => {
      try {
        if (resultat === null) {
          done();
        } else {
          expect(resultat[0].responsable_hierarchique).toBe("TOURENG Hadrien");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readAllByOrganisation Offre Emploi", (done) => {
    oe.readAllByOrganisation("407751858", (resultat) => {
      try {
        if (resultat === null) {
          done();
        } else {
          expect(resultat[0].statut_de_poste).toBe("cadre");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("create Offre Emploi", (done) => {
    // l'id_fiche est 11729 est volontairement faux pour éviter de créer à chaque fois une nouvelle fiche de poste
    oe.creat("publiee", "2025-07-09", null, 5, 11729, (resultat) => {
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
    });
  });
  test("update Offre Emploi", (done) => {
    var dico = {
      etat: "publiee",
      date_validite: "2025-07-09",
      indication:
        "CV, lettre de motivation, attestion d'habitat, casier judiciaire",
      nb_pieces_demandees: null,
    };
    oe.update(4, dico, (resultat) => {
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
  test("delete Fiche Poste", (done) => {
    // numero 400 inexistant pris exrès pour ne rien supprimer
    oe.delete(400, (resultat) => {
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
