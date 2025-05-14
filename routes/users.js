var express = require("express");
var router = express.Router();
var db = require("../model/db.js");

var candidat = require("../model/candidat.js");
var admin = require("../model/administrateur.js");
var organisation = require("../model/organisation.js");
var pjd = require("../model/piece_jointe_durable.js");
var demandeR = require("../model/demande_recruteur.js");
var demandeCrO = require("../model/demande_creation_organisation.js");
var fp = require("../model/fiche_poste.js");
var offre = require("../model/offre_emploi.js");
var candidature = require("../model/candidature.js");
var pjt = require("../model/piece_jointe_temporaire.js");
var rec = require("../model/recruteur.js");
var demandeChO = require("../model/demande_changer_organisation.js");

router.get("/userlist", function (req, res, next) {
  result = candidat.readall((result) => {
    res.render("userlist", { title: "Liste des Utilisateurs", users: result });
  });
});

router.get("/adminlist", function (req, res, next) {
  result = admin.readall(function (result) {
    res.render("adminlist", {
      title: "Liste des Administrateurs",
      users: result,
    });
  });
});

router.get("/orgalist", function (req, res, next) {
  result = organisation.readall(function (result) {
    res.render("orgalist", {
      title: "Liste des Organisations",
      orgs: result,
    });
  });
});

router.get("/pjdlist", function (req, res, next) {
  result = pjd.readall(function (result) {
    res.render("pjdlist", {
      title: "Liste des Pièces Jointes Durables",
      pjds: result,
    });
  });
});

router.get("/demandeRlist", function (req, res, next) {
  result = demandeR.readall((result) => {
    res.render("demandeRlist", {
      title: "Liste de Demandes de Recruteur",
      demandes: result,
    });
  });
});

router.get("/demandeCrOlist", function (req, res, next) {
  result = demandeCrO.readall((result) => {
    res.render("demandeCrOlist", {
      title: "Liste de Demandes de Création d'Organisation",
      demandes: result,
    });
  });
});

router.get("/fichePostelist", function (req, res, next) {
  result = fp.readall((result) => {
    res.render("fichelist", {
      title: "Liste de Fiches de Poste",
      fiches: result,
    });
  });
});

router.get("/offreEmploilist", function (req, res, next) {
  result = offre.readall((result) => {
    res.render("offrelist", {
      title: "Liste des Offres d'Emploi",
      offres: result,
    });
  });
});

router.get("/candidaturelist", function (req, res, next) {
  result = candidature.readall((result) => {
    res.render("candidaturelist", {
      title: "Liste des Candidatures",
      candidatures: result,
    });
  });
});

router.get("/pjtlist", function (req, res, next) {
  result = pjt.readall(function (result) {
    res.render("pjtlist", {
      title: "Liste des pièces jointes temporaires",
      pjts: result,
    });
  });
});

router.get("/reclist", function (req, res, next) {
  result = rec.readall((result) => {
    res.render("reclist", { title: "Liste des Recruteurs", recs: result });
  });
});

router.get("/demandeChOlist", function (req, res, next) {
  result = demandeChO.readall((result) => {
    res.render("demandeChOlist", {
      title: "Liste de Demandes de Changement d'Organisation",
      demandes: result,
    });
  });
});

/////////////////////////////////////////////////////////////////////////////
router.get("/login", function (req, res, next) {
  res.render("Login", { title: "S'authentifier" });
});

router.post('/login', function(req, res, next) {
  const { email, password } = req.body;
  console.log("email :", email);
  console.log("password :", password);

  candidat.connect(email, password, (result) => {
    if (!result || result.length === 0) {
      return res.send("Identifiants incorrects.");
    }  
    const utilisateur = result[0];
    console.log("result :", utilisateur);
    console.log("type :", typeof utilisateur);
  
    utilisateur.role = "candidat";
    req.session.userid = utilisateur.email;
    req.session.role = utilisateur.role;

    console.log("Session enregistrée :", req.session);

    res.redirect("/users/ListeOffres");
  });
});

router.get("/Profile", function (req, res, next) {
  if (!req.session.userid) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }
  const email = req.session.userid;
  candidat.read(email, function(result) {
    if (!result || result.length === 0) {
      return res.status(404).send("Candidat non trouvée.");
    }
    res.render("Profile", {
      title: "Informations Personnelles",
      candidat: result[0]
    });
  });
});

router.get("/ListeOffres", function (req, res, next) {
  offre.readAllWithFicheAndOrganisation((result) => {
    res.render("ListeOffres", {
      title: "Liste des Offres d'Emploi",
      offres: result
    });
  });
});

router.get("/inscription", function (req, res, next) {
  res.render("inscription", { title: "Créer un compte" });
});

router.post('/inscription', function(req, res, next) {
  const { nom, prenom, num, email, password, password2 } = req.body;

  // Exemple de simple validation pour le moment
  if (!nom || !prenom || !num || !email || !password || !password2) {
    return res.status(400).send("Veuillez remplir tous les champs !");
  }

  if (password !== password2) {
    return res.send("Les mots de passe ne correspondent pas !");
  }

  // Statut = actif par défaut, à voir si on le garde
  // ou si on le met à inactif par défaut et qu'on l'active après validation
  const statut = "actif";

  candidat.creat(email, password, nom, prenom, num, statut, (result) => {
    if (!result) {
      return res.send("Erreur lors de l'inscription. Vérifiez vos données !");
    } else {
      res.redirect('/users/userlist'); // après inscription, retour à la liste des utilisateurs (à enlever ensuite car c'est pour tester)
    }
  });
});

router.get("/offre/:id", function (req, res, next) {
  const id = req.params.id;

  offre.readWithFicheAndOrganisation(id, function (result) {
    if (!result || result.length === 0) {
      return res.status(404).send("Offre non trouvée.");
    }

    res.render("OffreDetail", {
      title: "Détail de l'offre",
      offre: result[0],
    });
  });
});

router.post('/postuler', function(req, res, next) {
  // Vérifier si l'utilisateur est connecté sinon impossible
  if (!req.session.userid) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  const email = req.session.userid;
  const numero_offre = parseInt(req.body.numero_offre, 10);

  // Récupérer l'ID du candidat à partir de son email (très important, sinon on ne peut pas récupérer id_candidat)
  candidat.read(email, function(result) {
    if (!result || result.length === 0) {
      return res.status(404).send("Candidat non trouvé.");
    }
    const id_candidat = result[0].id_can;
    
    candidature.creat(id_candidat, numero_offre, (result) => {
      if (result === null) {
        return res.send("Erreur lors de la candidature. Vous avez peut-être déjà postulé à cette offre.");
      } else {
        res.redirect('/users/ListeOffres');
      }
    });
  });
});

router.get("/offre/:id", function (req, res, next) {
  const id = req.params.id;

  offre.readWithFicheAndOrganisation(id, function (result) {
    if (!result || result.length === 0) {
      return res.status(404).send("Offre non trouvée.");
    }

    res.render("OffreDetail", {
      title: "Détail de l'offre",
      offre: result[0],
    });
  });
});

router.get("/MesOffres", function (req, res, next) {
  // Vérifier si l'utilisateur est connecté (toujours important avec la session)
  if (!req.session.userid) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  const email = req.session.userid;

  // Récupérer l'ID du candidat à partir de son email (très important, sinon on ne peut pas récupérer id_candidat)
  candidat.read(email, function(candidatResult) {
    if (!candidatResult || candidatResult.length === 0) {
      return res.status(404).send("Candidat non trouvé.");
    }
    const id_candidat = candidatResult[0].id_can;
  
    candidature.readCandidaturesWithOffreDetails(id_candidat, (offres) => {
      res.render("MesOffres", {
        title: "Mes candidatures",
        offres: offres
      });
    });
  });
});

module.exports = router;
