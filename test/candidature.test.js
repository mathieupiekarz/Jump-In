const DB = require("../model/db.js");
const candidature = require("../model/candidature.js");

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
  test("read candidature", (done) => {
    candidature.read(1, 1, (resultat) => {
      try {
        if (resultat === null) done();
        else {
          const dateSQL = new Date(resultat[0].date_candidature);
          expect(dateSQL.toLocaleDateString("fr-CA")).toBe("2025-04-26");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readall candidature", (done) => {
    candidature.readall((resultat) => {
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
  test("readWithCandidatAndOffre candidature", (done) => {
    candidature.readWithCandidatAndOffre(1, 1, (resultat) => {
      try {
        if (resultat === null) done();
        else {
          expect(resultat[0].type_metier).toBe("chimie des acides");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("readCandidaturesWithOffreDetails candidature", (done) => {
    candidature.readCandidaturesWithOffreDetails(9, (resultat) => {
      try {
        if (resultat.length === 0) done();
        else {
          expect(resultat[0].type_metier).toBe("chimie des acides");
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });
  test("create candidature", (done) => {
    candidature.creat(1, 2, (resultat) => {
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
  test("delete candidature ", (done) => {
    candidature.delete(500, 500, (resultat) => {
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
