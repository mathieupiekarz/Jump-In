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

// Route pour voir les candidats d'une offre spécifique (à implémenter)
router.get("/:entreprise_id/offre/:offre_id/candidats", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;
  
  // À implémenter plus tard
  res.send("Affichage des candidats pour l'offre " + offre_id + " de l'organisation " + siren);
});

// Route pour modifier une offre (à implémenter)
router.get("/:entreprise_id/offre/:offre_id/modifier", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;
  
  // À implémenter plus tard
  res.send("Modification de l'offre " + offre_id + " de l'organisation " + siren);
});

// Route pour supprimer une offre (à implémenter)
router.post("/:entreprise_id/offre/:offre_id/supprimer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;
  
  // À implémenter plus tard
  res.send("Suppression de l'offre " + offre_id + " de l'organisation " + siren);
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

module.exports = router; 