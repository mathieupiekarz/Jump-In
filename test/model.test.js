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
    candidat.read("pierre.liquois@gmail.com", (resultat) => {
      try {
        expect(resultat[0].nom).toBe("navarre");
        console.log(resultat[0]);
        done();
      } catch (err) {
        done(err);
      }
    });
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
          console.log(resultat);
          console.log(typeof resultat);
          done();
        } catch (err) {
          done(err);
        }
      }
    );
  });
});
