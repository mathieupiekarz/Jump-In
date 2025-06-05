var express = require("express");
var router = express.Router();
var db = require("../model/db.js");
var session = require("../session.js");

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
var demandeChO = require("../model/Demande_changer_organisation.js");

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

router.post("/login", function (req, res, next) {
  const { email, password } = req.body;

  // Vérifier d'abord si c'est un admin
  admin.read(email, function (adminResult) {
    if (adminResult && adminResult.length > 0) {
      const adminUser = adminResult[0];
      if (adminUser.mdp === password) {
        session.creatSession(
          req.session,
          {
            id: adminUser.id_admin,
            email: adminUser.email,
          },
          "admin"
        );
        return res.redirect("/admin/dashboard");
      }
    }

    // Vérifier si c'est un recruteur
    rec.read(email, function (recruteurResult) {
      if (recruteurResult && recruteurResult.length > 0) {
        const recruteur = recruteurResult[0];
        if (recruteur.mdp === password) {
          session.creatSession(
            req.session,
            {
              id: recruteur.id_rec,
              email: recruteur.email,
              siren: recruteur.siren,
            },
            "recruteur"
          );
          return res.redirect(`/recruteur/${recruteur.siren}/NosOffres`);
        }
      }

      // Vérifier si c'est un candidat
      candidat.read(email, function (candidatResult) {
        if (candidatResult && candidatResult.length > 0) {
          const candidat = candidatResult[0];
          if (candidat.mdp === password) {
            session.creatSession(
              req.session,
              {
                id: candidat.id_can,
                email: candidat.email,
              },
              "candidat"
            );
            return res.redirect("/users/ListeOffres");
          }
        }

        // Si aucun utilisateur n'est trouvé ou le mot de passe est incorrect
        res.render("Login", {
          error: "Email ou mot de passe incorrect",
        });
      });
    });
  });
});

router.get("/Profile", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  candidat.readById(req.session.id_candidat, function (result) {
    if (!result || result.length === 0) {
      return res.status(404).send("Candidat non trouvé.");
    }

    // Récupérer le message de succès s'il existe
    const successMessage = req.session.successMessage;
    // Supprimer le message de la session pour qu'il ne s'affiche qu'une fois
    delete req.session.successMessage;

    res.render("Profile", {
      title: "Informations Personnelles",
      candidat: result[0],
      successMessage: successMessage,
    });
  });
});

router.get("/ListeOffres", function (req, res, next) {
  offre.readAllWithFicheAndOrganisation((result) => {
    res.render("ListeOffres", {
      title: "Liste des Offres d'Emploi",
      offres: result,
    });
  });
});

router.get("/inscription", function (req, res, next) {
  res.render("inscription", { title: "Créer un compte" });
});

router.post("/inscription", function (req, res, next) {
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
      res.redirect("/users/userlist"); // après inscription, retour à la liste des utilisateurs (à enlever ensuite car c'est pour tester)
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

router.post("/postuler", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  const id_candidat = req.session.id_candidat;
  const numero_offre = parseInt(req.body.numero_offre, 10);

  candidature.creat(id_candidat, numero_offre, (result) => {
    if (result === null) {
      return res.send(
        "Erreur lors de la candidature. Vous avez peut-être déjà postulé à cette offre."
      );
    } else {
      res.redirect("/users/ListeOffres");
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

router.get("/MesOffres", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  const id_candidat = req.session.id_candidat;

  candidature.readCandidaturesWithOffreDetails(id_candidat, (offres) => {
    res.render("MesOffres", {
      title: "Mes candidatures",
      offres: offres,
    });
  });
});

router.post("/updateProfile", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  const id_candidat = req.session.id_candidat;

  // Récupérer les données du formulaire
  const { prenom, nom, email: newEmail, numero_telephone, mdp } = req.body;

  // Créer un objet avec les champs à mettre à jour
  const updateData = {
    prenom,
    nom,
    email: newEmail,
    numero_telephone,
  };

  // Ajouter le mot de passe seulement si fourni
  if (mdp && mdp.trim() !== "") {
    updateData.mdp = mdp;
  }

  // Mettre à jour le profil du candidat
  candidat.update(id_candidat, updateData, (result) => {
    if (result === null) {
      return res
        .status(400)
        .send("Erreur lors de la mise à jour du profil. Vérifiez vos données.");
    }

    // Si l'email a été modifié, mettre à jour la session
    if (newEmail !== req.session.email) {
      req.session.email = newEmail;
    }

    // Stocker un message de succès dans la session
    req.session.successMessage = "Modifications apportées avec succès !";

    // Rediriger vers la page profil
    res.redirect("/users/Profile");
  });
});

// Route pour demander un changement d'organisation
router.post("/demande-recruteur", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.redirect("/login");
  }

  const { nouveau_siren, description } = req.body;

  // Vérifications basiques
  if (!nouveau_siren || !description || description.length < 10) {
    return res.redirect("/user/Profile");
  }

  // Vérifier que le recruteur existe et récupérer son SIREN actuel
  candidat.readById(req.session.id_candidat, function (candidatResult) {
    if (!candidatResult || candidatResult.length === 0) {
      return res.redirect("/login");
    }

    const siren_actuel = recruteurResult[0].siren;

    // Vérifier que le nouveau SIREN est différent de l'actuel
    if (nouveau_siren === siren_actuel) {
      return res.redirect("/recruteur/mon-compte");
    }

    // Créer la demande de changement
    dcho.creat(
      parseInt(req.session.id_rec),
      nouveau_siren,
      description,
      "en_attente",
      function (result) {
        if (!result) {
          return res.redirect("/recruteur/mon-compte");
        }

        // Rediriger vers la page mon-compte
        res.redirect("/recruteur/mon-compte");
      }
    );
  });
});

module.exports = router;
