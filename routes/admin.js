var express = require("express");
var router = express.Router();
var db = require("../model/db.js");

var candidat = require("../model/candidat.js");
var recruteur = require("../model/recruteur.js");
var organisation = require("../model/organisation.js");
var admin = require("../model/administrateur.js");
var demandeCreation = require("../model/demande_creation_organisation.js");
var demandeChangement = require("../model/demande_changer_organisation.js");

// Fonction utilitaire pour récupérer toutes les données nécessaires
function fetchAllData() {
  return {
    getCandidats: new Promise((resolve) => {
      candidat.readall((results) => {
        resolve(results);
      });
    }),
    
    getRecruteurs: new Promise((resolve) => {
      recruteur.readall((results) => {
        resolve(results);
      });
    }),
    
    getOrganisations: new Promise((resolve) => {
      organisation.readall((results) => {
        resolve(results);
      });
    }),
    
    getAdmins: new Promise((resolve) => {
      admin.readall((results) => {
        resolve(results);
      });
    }),

    getDemandesCreation: new Promise((resolve) => {
      demandeCreation.readall((results) => {
        resolve(results);
      });
    }),

    getDemandesChangement: new Promise((resolve) => {
      demandeChangement.readall((results) => {
        resolve(results);
      });
    })
  };
}

// Route index pour rediriger vers le tableau de bord
router.get("/", function(req, res) {
  res.redirect("/admin/dashboard");
});

// Route principale du tableau de bord avec onglet paramétrable
router.get("/dashboard", function (req, res, next) {
  // Déterminer l'onglet actif à partir du paramètre de requête, sinon utiliser "candidats" par défaut
  const activeTab = req.query.tab || "candidats";
  
  // Récupérer toutes les données
  const dataPromises = fetchAllData();
  
  // Attendre que toutes les requêtes soient terminées
  Promise.all([
    dataPromises.getCandidats, 
    dataPromises.getRecruteurs, 
    dataPromises.getOrganisations, 
    dataPromises.getAdmins
  ])
    .then(([candidats, recruteurs, organisations, admins]) => {
      // Préparer les données selon l'onglet actif
      let viewData = {
        title: "Tableau de bord administrateur",
        candidats: candidats,
        recruteurs: recruteurs,
        organisations: organisations,
        admins: admins,
        activeTab: activeTab
      };
      
      // Traiter les recruteurs si nécessaire
      if (activeTab === "recruteurs") {
        // Associer chaque recruteur à son organisation
        viewData.recruteurs = recruteurs.map(rec => {
          const org = organisations.find(o => o.siren === rec.siren);
          return { ...rec, organisation: org };
        });
      }
      
      // Rendre la vue
      res.render("AdminBoard", viewData);
    })
    .catch(error => {
      console.error("Erreur lors de la récupération des données:", error);
      res.status(500).send("Erreur serveur");
    });
});

// Route pour la page des demandes d'organisations avec onglet paramétrable
router.get("/requests", function (req, res, next) {
  // Déterminer l'onglet actif à partir du paramètre de requête, sinon utiliser "creation" par défaut
  const activeTab = req.query.tab || "creation";
  
  // Récupérer toutes les données nécessaires
  const dataPromises = fetchAllData();
  
  Promise.all([
    dataPromises.getDemandesCreation,
    dataPromises.getDemandesChangement,
    dataPromises.getCandidats,
    dataPromises.getRecruteurs
  ])
    .then(([demandesCreation, demandesChangement, candidats, recruteurs]) => {
      // Enrichir les demandes de création avec les informations des candidats
      const enrichedDemandesCreation = demandesCreation.map(demande => {
        const candidatInfo = candidats.find(c => c.id_can == demande.id_can);
        return { ...demande, candidat: candidatInfo };
      });
      
      // Enrichir les demandes de changement avec les informations des recruteurs
      const enrichedDemandesChangement = demandesChangement.map(demande => {
        const recruteurInfo = recruteurs.find(r => r.id_rec == demande.id_rec);
        return { ...demande, recruteur: recruteurInfo };
      });
      
      // Préparer les données pour la vue
      const viewData = {
        title: "Gestion des demandes",
        demandesCreation: enrichedDemandesCreation,
        demandesChangement: enrichedDemandesChangement,
        activeTab: activeTab
      };
      
      // Rendre la vue
      res.render("AdminRequests", viewData);
    })
    .catch(error => {
      console.error("Erreur lors de la récupération des demandes:", error);
      res.status(500).send("Erreur serveur");
    });
});

// Routes de commodité pour rediriger vers l'onglet approprié
router.get("/candidats", function (req, res) {
  res.redirect("/admin/dashboard?tab=candidats");
});

router.get("/recruteurs", function (req, res) {
  res.redirect("/admin/dashboard?tab=recruteurs");
});

router.get("/organisations", function (req, res) {
  res.redirect("/admin/dashboard?tab=organisations");
});

router.get("/admins", function (req, res) {
  res.redirect("/admin/dashboard?tab=admins");
});

// Route pour approuver une demande de création
router.post("/request/creation/:id_can/:siren/approve", function (req, res, next) {
  const id_can = req.params.id_can;
  const siren = req.params.siren;
  
  // 1. Mettre à jour le statut de la demande
  demandeCreation.update(id_can, siren, { statutCrO: "validee" }, (updateResult) => {
    if (updateResult) {
      // 2. Créer l'organisation si elle n'existe pas déjà
      organisation.read(siren, (existingOrg) => {
        if (existingOrg.length === 0) {
          // L'organisation n'existe pas, on doit la créer avec des valeurs par défaut
          const newOrg = {
            siren: siren,
            nom: "Nouvelle Organisation", // Valeur par défaut
            type: "Entreprise", // Valeur par défaut
            siege_social: JSON.stringify({ adresse: "À renseigner", ville: "", code_postal: "" }),
            statut: "active"
          };
          
          organisation.creat(newOrg.siren, newOrg.nom, newOrg.type, newOrg.siege_social, newOrg.statut, (createResult) => {
            res.redirect("/admin/requests?tab=creation");
          });
        } else {
          // L'organisation existe déjà, on met simplement son statut à active
          organisation.update(siren, { statut: "active" }, (updateOrgResult) => {
            res.redirect("/admin/requests?tab=creation");
          });
        }
      });
    } else {
      res.status(400).send("Échec de la mise à jour du statut de la demande");
    }
  });
});

// Route pour rejeter une demande de création
router.post("/request/creation/:id_can/:siren/reject", function (req, res, next) {
  const id_can = req.params.id_can;
  const siren = req.params.siren;
  
  demandeCreation.update(id_can, siren, { statutCrO: "refusee" }, (result) => {
    if (result) {
      res.redirect("/admin/requests?tab=creation");
    } else {
      res.status(400).send("Échec de la mise à jour du statut de la demande");
    }
  });
});

// Route pour approuver une demande de changement
router.post("/request/changement/:id_rec/:siren/approve", function (req, res, next) {
  const id_rec = req.params.id_rec;
  const siren = req.params.siren;
  
  // 1. Mettre à jour le statut de la demande
  demandeChangement.update(id_rec, siren, siren, { statutChO: "validee" }, (updateResult) => {
    if (updateResult) {
      // 2. Mettre à jour le SIREN du recruteur
      recruteur.readById(id_rec, (recruteurInfo) => {
        if (recruteurInfo.length > 0) {
          recruteur.update(id_rec, { siren: siren }, (updateRecruteurResult) => {
            res.redirect("/admin/requests?tab=changement");
          });
        } else {
          res.status(404).send("Recruteur non trouvé");
        }
      });
    } else {
      res.status(400).send("Échec de la mise à jour du statut de la demande");
    }
  });
});

// Route pour rejeter une demande de changement
router.post("/request/changement/:id_rec/:siren/reject", function (req, res, next) {
  const id_rec = req.params.id_rec;
  const siren = req.params.siren;
  
  demandeChangement.update(id_rec, siren, siren,{ statutChO: "refusee" }, (result) => {
    if (result) {
      res.redirect("/admin/requests?tab=changement");
    } else {
      res.status(400).send("Échec de la mise à jour du statut de la demande");
    }
  });
});

// Route pour activer/désactiver un candidat
router.post("/candidat/:id/toggleStatus", function (req, res, next) {
  const id = req.params.id;
  const newStatus = req.body.newStatus;
  
  if (newStatus && (newStatus === "actif" || newStatus === "inactif")) {
    candidat.update(id, { statut: newStatus }, (result) => {
      if (result) {
        res.redirect("/admin/dashboard?tab=candidats");
      } else {
        res.status(400).send("Échec de la mise à jour du statut");
      }
    });
  } else {
    res.status(400).send("Statut invalide");
  }
});

// Route pour activer/désactiver un recruteur
router.post("/recruteur/:id/toggleStatus", function (req, res, next) {
  const id = req.params.id;
  const newStatus = req.body.newStatus;
  
  if (newStatus && (newStatus === "actif" || newStatus === "inactif")) {
    recruteur.update(id, { statut: newStatus }, (result) => {
      if (result) {
        res.redirect("/admin/dashboard?tab=recruteurs");
      } else {
        res.status(400).send("Échec de la mise à jour du statut");
      }
    });
  } else {
    res.status(400).send("Statut invalide");
  }
});

// Route pour activer/désactiver une organisation
router.post("/organisation/:siren/toggleStatus", function (req, res, next) {
  const siren = req.params.siren;
  const newStatus = req.body.newStatus;
  
  if (newStatus && ["inactive", "en_cours", "active"].includes(newStatus)) {
    organisation.update(siren, { statut: newStatus }, (result) => {
      if (result) {
        res.redirect("/admin/dashboard?tab=organisations");
      } else {
        res.status(400).send("Échec de la mise à jour du statut");
      }
    });
  } else {
    res.status(400).send("Statut invalide");
  }
});

// Route pour activer/désactiver un administrateur
router.post("/admin/:id/toggleStatus", function (req, res, next) {
  const id = req.params.id;
  const newStatus = req.body.newStatus;
  
  if (newStatus && (newStatus === "actif" || newStatus === "inactif")) {
    admin.update(id, { statut: newStatus }, (result) => {
      if (result) {
        res.redirect("/admin/dashboard?tab=admins");
      } else {
        res.status(400).send("Échec de la mise à jour du statut");
      }
    });
  } else {
    res.status(400).send("Statut invalide");
  }
});

module.exports = router; 