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
  test("readByOrganisation Fiche Poste", (done) => {
    fp.readByOrganisation("407751858", (resultat) => {
      try {
        if (resultat === null) {
          done();
        } else {
          expect(resultat[0].organisation_nom).toBe("Ricard");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("create Fiche Poste", (done) => {
    // le numéro de siren 999999999 est volontairement faux pour éviter de créer à chaque fois une nouvelle fiche de poste
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
      "999999999",
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
  test("update Fiche Poste", (done) => {
    var dico = {
      intitule: "data scientist",
      statut_de_poste: "manager",
      responsable_hierarchique: "Patrick Eboué",
      type_metier: "data analyst",
      lieu_mission: {
        nom: "Maison rose",
        adresse: "3 rue des cactus blonds",
        complement: null,
        code_postal: "75",
        ville: "Paris",
        pays: "France",
      },
      rythme: "18h/j",
      fourchette_salaire: "10000e net",
      description:
        "recherche d'un data analyst pour analyser les données issues des nouveaux processeurs INTEL",
    };
    fp.update(7, dico, (resultat) => {
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
    // id_fiche 400 inexistant pris exrès pour ne rien supprimer
    fp.delete(400, (resultat) => {
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
