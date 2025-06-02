var express = require("express");
var router = express.Router();
var db = require("../model/db.js");

var organisation = require("../model/organisation.js");
var offre = require("../model/offre_emploi.js");
var candidature = require("../model/candidature.js");
var fp = require("../model/fiche_poste.js");
var rec = require("../model/recruteur.js");

// Route pour afficher les offres d'une organisation spécifique
router.get("/:entreprise_id/NosOffres", function (req, res, next) {
  const siren = req.params.entreprise_id;
  
  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Utiliser des promesses pour récupérer les offres et les fiches de poste en parallèle
    const getOffres = new Promise((resolve) => {
      offre.readAllByOrganisation(siren, (results) => {
        resolve(results);
      });
    });
    
    const getFiches = new Promise((resolve) => {
      fp.readByOrganisation(siren, (results) => {
        resolve(results);
      });
    });
    
    // Attendre que les deux requêtes soient terminées
    Promise.all([getOffres, getFiches])
      .then(([offres, fichesPoste]) => {
        res.render("NosOffres", {
          title: "Offres de " + orgResult[0].nom,
          offres: offres,
          fichesPoste: fichesPoste,
          organisation: orgResult[0]
        });
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des données:", error);
        res.status(500).send("Erreur serveur");
      });
  });
});

// Route pour voir les candidats d'une offre spécifique
router.get("/:entreprise_id/offre/:offre_id/candidats", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;
  
  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Récupérer les détails de l'offre avec la fiche de poste
    offre.readWithFicheAndOrganisation(parseInt(offre_id), function(offreResult) {
      if (!offreResult || offreResult.length === 0) {
        return res.status(404).send("Offre non trouvée.");
      }

      // Récupérer toutes les candidatures pour cette offre
      candidature.readByOffreWithCandidat(parseInt(offre_id), function(candidatures) {
        res.render("OffreCandidatures", {
          title: "Candidatures - " + offreResult[0].intitule,
          offre: offreResult[0],
          organisation: orgResult[0],
          candidatures: candidatures
        });
      });
    });
  });
});

// Route pour modifier une offre
router.post("/:entreprise_id/offre/:offre_id/modifier", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;
  const { etat, date_validite, indication, nb_pieces_demandees } = req.body;
  
  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Créer l'objet de mise à jour avec les champs modifiés
    const updateData = {
      etat: etat,
      date_validite: date_validite,
      indication: indication || null,
      nb_pieces_demandees: parseInt(nb_pieces_demandees)
    };

    // Mettre à jour l'offre
    offre.update(parseInt(offre_id), updateData, function(result) {
      if (!result) {
        return res.status(400).send("Erreur lors de la modification de l'offre. Veuillez vérifier les données saisies.");
      }
      // Rediriger vers la page des offres
      res.redirect(`/recruteur/${siren}/NosOffres`);
    });
  });
});

// Route pour supprimer une offre
router.post("/:entreprise_id/offre/:offre_id/supprimer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;
  
  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Supprimer l'offre
    offre.delete(parseInt(offre_id), function(result) {
      if (!result) {
        return res.status(400).send("Erreur lors de la suppression de l'offre. L'offre n'existe peut-être pas.");
      }
      // Rediriger vers la page des offres
      res.redirect(`/recruteur/${siren}/NosOffres`);
    });
  });
});

// Route pour modifier une fiche de poste (à implémenter)
router.get("/:entreprise_id/fiche/:fiche_id/modifier", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const fiche_id = req.params.fiche_id;
  
  // À implémenter plus tard
  res.send("Modification de la fiche de poste " + fiche_id + " de l'organisation " + siren);
});

// Route pour supprimer une fiche de poste (à implémenter)
router.post("/:entreprise_id/fiche/:fiche_id/supprimer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const fiche_id = req.params.fiche_id;
  
  // À implémenter plus tard
  res.send("Suppression de la fiche de poste " + fiche_id + " de l'organisation " + siren);
});

// Route pour afficher le formulaire de création d'une fiche de poste
router.get("/:entreprise_id/fiche/creer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  
  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }
    
    res.render("CreerFichePoste", {
      title: "Créer une fiche de poste",
      organisation: orgResult[0]
    });
  });
});

// Route pour traiter la création d'une fiche de poste
router.post("/:entreprise_id/fiche/creer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  
  // À implémenter plus tard - Récupération des données du formulaire et création de la fiche
  res.send("Création d'une fiche de poste pour l'organisation " + siren);
});

// Route pour traiter la création d'une offre d'emploi
router.post("/:entreprise_id/offre/creer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const { id_fiche, etat, date_validite, indication, nb_pieces_demandees } = req.body;

  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Créer l'offre d'emploi
    offre.creat(
      etat,
      date_validite,
      indication || null,
      parseInt(nb_pieces_demandees),
      parseInt(id_fiche),
      function(result) {
        if (!result) {
          return res.status(400).send("Erreur lors de la création de l'offre. Veuillez vérifier les données saisies.");
        }
        // Rediriger vers la page des offres
        res.redirect(`/recruteur/${siren}/NosOffres`);
      }
    );
  });
});

// Route pour traiter la création d'une offre à partir d'une fiche
router.post("/:entreprise_id/fiche/:fiche_id/creer-offre", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const fiche_id = req.params.fiche_id;
  const { etat, date_validite, indication, nb_pieces_demandees } = req.body;

  // Vérifier si l'organisation existe
  organisation.read(siren, function(orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Vérifier si la fiche de poste existe et appartient à l'organisation
    fp.read(parseInt(fiche_id), function(ficheResult) {
      if (!ficheResult || ficheResult.length === 0) {
        return res.status(404).send("Fiche de poste non trouvée.");
      }

      if (ficheResult[0].siren !== siren) {
        return res.status(403).send("Vous n'avez pas accès à cette fiche de poste.");
      }

      // Créer l'offre d'emploi
      offre.creat(
        etat,
        date_validite,
        indication || null,
        parseInt(nb_pieces_demandees),
        parseInt(fiche_id),
        function(result) {
          if (!result) {
            return res.status(400).send("Erreur lors de la création de l'offre. Veuillez vérifier les données saisies.");
          }
          // Rediriger vers la page des offres
          res.redirect(`/recruteur/${siren}/NosOffres`);
        }
      );
    });
  });
});

module.exports = router; 