var express = require("express");
var router = express.Router();
var db = require("../model/db.js");
var session = require("../session.js");
var { sendEmail, emailTemplates } = require("../services/email.js");

var { geocode } = require("../services/geocode.js");
var { calculDistance } = require("../services/distance.js");

var candidat = require("../model/candidat.js");
var recruteur = require("../model/recruteur.js");
var organisation = require("../model/organisation.js");
var admin = require("../model/administrateur.js");
var demandeCreation = require("../model/demande_creation_organisation.js");
var demandeChangement = require("../model/Demande_changer_organisation.js");
var demandeRecrutement = require("../model/demande_recruteur.js");

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
      demandeCreation.readall((err, results) => {
        resolve(results);
      });
    }),

    getDemandesChangement: new Promise((resolve) => {
      demandeChangement.readall((err, results) => {
        resolve(results);
      });
    }),

    getDemandesRecrutement: new Promise((resolve) => {
      demandeRecrutement.readall((err, results) => {
        resolve(results);
      });
    }),
  };
}

// Route index pour rediriger vers le tableau de bord
router.get("/", function (req, res) {
  res.redirect("/admin/dashboard");
});

/*
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
    dataPromises.getAdmins,
  ])
    .then(([candidats, recruteurs, organisations, admins]) => {
      // Préparer les données selon l'onglet actif
      let viewData = {
        title: "Tableau de bord administrateur",
        candidats: candidats,
        recruteurs: recruteurs,
        organisations: organisations,
        admins: admins,
        activeTab: activeTab,
      };

      // Traiter les recruteurs si nécessaire
      if (activeTab === "recruteurs") {
        // Associer chaque recruteur à son organisation
        viewData.recruteurs = recruteurs.map((rec) => {
          const org = organisations.find((o) => o.siren === rec.siren);
          return { ...rec, organisation: org };
        });
      }

      // Rendre la vue
      res.render("AdminBoard", viewData);
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données:", error);
      res.status(500).send("Erreur serveur");
    });
});
*/

// Route principale du tableau de bord avec filtres dynamiques
router.get("/dashboard", async function (req, res, next) {
  const activeTab = req.query.tab || "candidats";

  try {
    const dataPromises = fetchAllData();
    const [candidats, recruteurs, organisations, admins] = await Promise.all([
      dataPromises.getCandidats,
      dataPromises.getRecruteurs,
      dataPromises.getOrganisations,
      dataPromises.getAdmins,
    ]);

    const {
      statut,
      nom,
      prenom,
      email,
      numero_telephone,
      siren,
      nom_org,
      type_org,
      ville,
      lat,
      lng,
    } = req.query;

    const match = (filter, value) => {
      const f = [].concat(filter || []);
      return (
        f.length === 0 ||
        f.some((v) => value?.toLowerCase() === v.toLowerCase())
      );
    };

    const filterFn = (user) => {
      if (!match(statut, user.statut)) return false;
      if (!match(nom, user.nom)) return false;
      if (!match(prenom, user.prenom)) return false;
      if (!match(email, user.email)) return false;
      if (!match(numero_telephone, user.numero_telephone)) return false;
      return true;
    };

    let filteredCandidats = candidats;
    let filteredRecruteurs = recruteurs;
    let filteredAdmins = admins;
    let filteredOrganisations = organisations;

    // enrichissement organisations + géodistance
    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);

    const allOrganisationsEnriched = await Promise.all(
      organisations.map(async (org) => {
        let ville = null;
        let distance = Infinity;
        try {
          const siege = JSON.parse(org.siege_social);
          ville = siege.ville;
          if (ville && !isNaN(uLat) && !isNaN(uLng)) {
            const { lat: orgLat, lon: orgLng } = await geocode(ville);
            distance = calculDistance(uLat, uLng, orgLat, orgLng);
          }
        } catch {}
        return { ...org, ville, distance };
      })
    );

    if (activeTab === "candidats") {
      filteredCandidats = candidats.filter(filterFn);
    } else if (activeTab === "recruteurs") {
      filteredRecruteurs = recruteurs
        .map((rec) => ({
          ...rec,
          organisation: organisations.find((o) => o.siren === rec.siren),
        }))
        .filter(filterFn);
    } else if (activeTab === "admins") {
      filteredAdmins = admins.filter(filterFn);
    } else if (activeTab === "organisations") {
      filteredOrganisations = allOrganisationsEnriched.filter((org) => {
        if (!match(siren, org.siren)) return false;
        if (!match(nom_org, org.nom)) return false;
        if (!match(type_org, org.type)) return false;
        if (!match(ville, org.ville)) return false;
        return true;
      });
    }

    let usersFiltres = [];
    if (activeTab === "candidats") usersFiltres = candidats;
    else if (activeTab === "recruteurs") usersFiltres = recruteurs;
    else if (activeTab === "admins") usersFiltres = admins;
    else if (activeTab === "organisations") usersFiltres = organisations;

    const orgsFiltres = allOrganisationsEnriched;

    const unique = (list, key) => [
      ...new Set(list.map((item) => item[key]).filter(Boolean)),
    ];

    // Construction des villes possibles (même sans distance)
    const villesDistances = {};
    for (const org of allOrganisationsEnriched) {
      if (org.ville) {
        if (
          !villesDistances[org.ville] ||
          (isFinite(org.distance) && villesDistances[org.ville] > org.distance)
        ) {
          villesDistances[org.ville] = isFinite(org.distance)
            ? org.distance
            : null;
        }
      }
    }

    const villesPossibles = Object.entries(villesDistances)
      .map(([ville, distance]) => ({ ville, distance }))
      .sort((a, b) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });

    const viewData = {
      title: "Tableau de bord administrateur",
      activeTab,
      candidats: filteredCandidats,
      recruteurs: filteredRecruteurs,
      organisations: filteredOrganisations,
      admins: filteredAdmins,
      selectedFilters: req.query,
      statutsPossibles: unique(usersFiltres, "statut"),
      nomsPossibles: unique(usersFiltres, "nom"),
      prenomsPossibles: unique(usersFiltres, "prenom"),
      emailsPossibles: unique(usersFiltres, "email"),
      numerosPossibles: unique(usersFiltres, "numero_telephone"),
      villesPossibles,
      sirensPossibles: unique(orgsFiltres, "siren"),
      nomsOrgsPossibles: unique(orgsFiltres, "nom"),
      typesOrgsPossibles: unique(orgsFiltres, "type"),
    };

    res.render("AdminBoard", viewData);
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).send("Erreur serveur");
  }
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
    dataPromises.getDemandesRecrutement,
    dataPromises.getCandidats,
    dataPromises.getRecruteurs,
    dataPromises.getOrganisations,
  ])
    .then(
      ([
        demandesCreation,
        demandesChangement,
        demandesRecrutement,
        candidats,
        recruteurs,
        organisations,
      ]) => {
        // Enrichir les demandes de création avec les informations des candidats
        const enrichedDemandesCreation = demandesCreation.map((demande) => {
          const candidatInfo = candidats.find(
            (c) => c.id_can == demande.id_can
          );
          return { ...demande, candidat: candidatInfo };
        });

        // Enrichir les demandes de changement avec les informations des recruteurs
        const enrichedDemandesChangement = demandesChangement.map((demande) => {
          const recruteurInfo = recruteurs.find(
            (r) => r.id_rec == demande.id_rec
          );
          return { ...demande, recruteur: recruteurInfo };
        });

        // Enrichir les demandes de recrutement avec les informations des candidats et organisations
        const enrichedDemandesRecrutement = demandesRecrutement.map(
          (demande) => {
            const candidatInfo = candidats.find(
              (c) => c.id_can == demande.id_can
            );
            const organisationInfo = organisations.find(
              (o) => o.siren === demande.siren
            );
            return {
              ...demande,
              candidat: candidatInfo,
              organisation: organisationInfo,
            };
          }
        );

        // Préparer les données pour la vue
        const viewData = {
          title: "Gestion des demandes",
          demandesCreation: enrichedDemandesCreation,
          demandesChangement: enrichedDemandesChangement,
          demandesRecrutement: enrichedDemandesRecrutement,
          activeTab: activeTab,
        };

        // Rendre la vue
        res.render("AdminRequests", viewData);
      }
    )
    .catch((error) => {
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
router.post(
  "/request/creation/:id_can/:siren/approve",
  async function (req, res) {
    const id_can = parseInt(req.params.id_can);
    const siren = req.params.siren;

    try {
      // Lire la demande (callback: (result))
      const demandeResult = await new Promise((resolve) => {
        demandeCreation.read(id_can, siren, (result) => resolve(result));
      });
      if (!demandeResult || demandeResult.length === 0) {
        return res.status(404).send("Demande non trouvée");
      }

      const demande = demandeResult[0];

      // Parser le JSON du siège social
      let siege_social;
      try {
        siege_social = JSON.parse(demande.siege_social);
      } catch (error) {
        return res.status(400).send("Format de siège social invalide");
      }

      // Lire les informations du candidat (callback: (result))
      const candidatResult = await new Promise((resolve) => {
        candidat.readById(id_can, (result) => resolve(result));
      });
      if (!candidatResult || candidatResult.length === 0) {
        return res.status(404).send("Candidat non trouvé");
      }

      const candidatInfo = candidatResult[0];

      // Créer l'organisation (callback: (err, result))
      const orgResult = await new Promise((resolve, reject) => {
        organisation.creat(
          siren,
          demande.nom,
          demande.type,
          siege_social,
          "active",
          (err, result) => {
            if (err || result === null) {
              return reject("Erreur lors de la création de l'organisation");
            }
            resolve(result);
          }
        );
      });

      // Créer le compte recruteur (callback: (err, result))
      const recruteurResult = await new Promise((resolve, reject) => {
        recruteur.creat(
          siren,
          candidatInfo.email,
          candidatInfo.mdp,
          candidatInfo.nom,
          candidatInfo.prenom,
          candidatInfo.numero_telephone,
          "actif",
          (err, result) => {
            if (err || !result) {
              return reject("Erreur lors de la création du compte recruteur");
            }
            resolve(result);
          }
        );
      });

      // Envoi de l’e-mail de confirmation (fonction async, retourne true/false)
      const template = emailTemplates.demandeOrganisationValidee(
        candidatInfo.nom,
        candidatInfo.prenom,
        demande.nom
      );
      const emailOK = await sendEmail(candidatInfo.email, template);
      if (!emailOK) {
        console.warn("Échec de l'envoi de l'email");
        // On continue même si l'e-mail échoue
      }

      // Mise à jour de la demande (callback: (err, result) où result peut être null, 0 ou >= 1)
      const updateResult = await new Promise((resolve, reject) => {
        demandeCreation.update(
          id_can,
          siren,
          { statutCrO: "validee" },
          (err, result) => {
            if (err) return reject("Erreur SQL lors de la mise à jour");
            if (result === null)
              return reject("Données de mise à jour invalides");
            if (result === 0) return reject("Aucun champ à mettre à jour");
            resolve(result);
          }
        );
      });

      // Supprimer le compte candidat (callback: (result))
      const deleteResult = await new Promise((resolve) => {
        candidat.delete(id_can, (result) => resolve(result));
      });

      if (deleteResult === null) {
        return res.status(404).send("Candidat non trouvé");
      }

      if (deleteResult === 0) {
        return res.status(400).send("Aucune suppression effectuée");
      }

      // Tout est OK
      return res.redirect("/admin/requests?tab=creation");
    } catch (error) {
      console.error("Erreur :", error);
      return res.status(500).send(error.toString());
    }
  }
);

// Route pour rejeter une demande de création
router.post(
  "/request/creation/:id_can/:siren/reject",
  function (req, res, next) {
    const id_can = parseInt(req.params.id_can);
    const siren = req.params.siren;

    demandeCreation.update(
      id_can,
      siren,
      { statutCrO: "refusee" },
      (err, result) => {
        if (err) {
          console.error("Erreur SQL lors de la mise à jour :", err);
          return res.status(500).send("Erreur interne du serveur");
        }

        if (result === null) {
          return res
            .status(400)
            .send("Requête invalide : statut ou données incorrectes");
        }

        if (result === 0) {
          return res
            .status(400)
            .send(
              "Aucune mise à jour effectuée : demande introuvable ou déjà à jour"
            );
        }

        // Succès
        return res.redirect("/admin/requests?tab=creation");
      }
    );
  }
);

// Route pour approuver une demande de changement
router.post(
  "/request/changement/:id_rec/:siren/approve",
  function (req, res, next) {
    const id_rec = parseInt(req.params.id_rec);
    const siren = req.params.siren;

    // Mettre à jour le statut de la demande
    demandeChangement.update(
      id_rec,
      siren,
      siren,
      { statutChO: "validee" },
      (err, updateResult) => {
        if (err) {
          console.error("Erreur lors de la mise à jour de la demande :", err);
          return res.status(500).send("Erreur interne");
        }
        if (!updateResult) {
          return res
            .status(400)
            .send("Échec de la mise à jour du statut de la demande");
        }

        // Lire le recruteur concerné
        recruteur.readById(id_rec, (recruteurInfo) => {
          if (!recruteurInfo || recruteurInfo.length === 0) {
            return res.status(404).send("Recruteur non trouvé");
          }

          // Mettre à jour le SIREN du recruteur
          recruteur.update(
            id_rec,
            { siren: siren },
            (err, updateRecruteurResult) => {
              if (err || !updateRecruteurResult) {
                console.error(
                  "Erreur lors de la mise à jour du recruteur :",
                  err
                );
                return res
                  .status(400)
                  .send("Erreur lors de la mise à jour du recruteur");
              }

              // Succès
              return res.redirect("/admin/requests?tab=changement");
            }
          );
        });
      }
    );
  }
);

// Route pour rejeter une demande de changement
router.post(
  "/request/changement/:id_rec/:siren/reject",
  function (req, res, next) {
    const id_rec = parseInt(req.params.id_rec);
    const siren = req.params.siren;

    demandeChangement.update(
      id_rec,
      siren,
      siren,
      { statutChO: "refusee" },
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erreur serveur lors de la mise à jour");
        }
        if (!result) {
          return res
            .status(400)
            .send("Échec de la mise à jour du statut de la demande");
        }
        res.redirect("/admin/requests?tab=changement");
      }
    );
  }
);

// Route pour activer/désactiver un candidat
router.post("/candidat/:id/toggleStatus", function (req, res, next) {
  const id = parseInt(req.params.id);
  const newStatus = req.body.newStatus;

  if (newStatus && (newStatus === "actif" || newStatus === "inactif")) {
    candidat.update(id, { statut: newStatus }, (err, result) => {
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
  const id = parseInt(req.params.id);
  const newStatus = req.body.newStatus;

  if (newStatus && (newStatus === "actif" || newStatus === "inactif")) {
    recruteur.update(id, { statut: newStatus }, (err, result) => {
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

  // Vérifie que le statut est valide
  if (!["inactive", "active"].includes(newStatus)) {
    return res.status(400).send("Statut invalide");
  }

  // Mise à jour du statut
  organisation.update(siren, { statut: newStatus }, (err, result) => {
    if (err) {
      console.error("Erreur SQL lors de la mise à jour :", err);
      return res.status(500).send("Erreur interne du serveur");
    }

    if (result === null) {
      return res.status(400).send("Format de données invalide");
    }

    if (result === 0) {
      return res.status(400).send("Aucune mise à jour effectuée");
    }

    // Mise à jour réussie
    return res.redirect("/admin/dashboard?tab=organisations");
  });
});

// Route pour activer/désactiver un administrateur
router.post("/admin/:id/toggleStatus", function (req, res, next) {
  const id = parseInt(req.params.id);
  const newStatus = req.body.newStatus;

  if (newStatus && (newStatus === "actif" || newStatus === "inactif")) {
    admin.update(id, { statut: newStatus }, (err, result) => {
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

// Route pour approuver une demande de recrutement
router.post(
  "/request/recrutement/:id_can/:siren/approve",
  function (req, res, next) {
    const id_can = parseInt(req.params.id_can);
    const siren = req.params.siren;

    // Récupérer les informations du candidat
    candidat.readById(id_can, function (candidatResult) {
      if (!candidatResult || candidatResult.length === 0) {
        return res.status(404).send("Candidat non trouvé");
      }

      const candidatInfo = candidatResult[0];
      console.log("Informations du candidat:", {
        siren,
        email: candidatInfo.email,
        nom: candidatInfo.nom,
        prenom: candidatInfo.prenom,
        numero_telephone: candidatInfo.numero_telephone,
      });

      // Vérifier si l'organisation existe
      organisation.read(siren, function (orgResult) {
        if (!orgResult || orgResult.length === 0) {
          console.log("Organisation non trouvée avec le SIREN:", siren);
          return res.status(404).send("Organisation non trouvée");
        }

        console.log("Organisation trouvée:", orgResult[0]);

        // Créer le compte recruteur
        recruteur.creat(
          siren,
          candidatInfo.email,
          candidatInfo.mdp,
          candidatInfo.nom,
          candidatInfo.prenom,
          candidatInfo.numero_telephone,
          "actif",
          function (err, recruteurResult) {
            if (!recruteurResult) {
              console.log("Échec de la création du compte recruteur");
              return res
                .status(400)
                .send("Erreur lors de la création du compte recruteur");
            }

            // Mettre à jour le statut de la demande
            demandeRecrutement.update(
              id_can,
              siren,
              siren,
              { statutDR: "validee" },
              function (err, updateResult) {
                if (!updateResult) {
                  console.log(
                    "Échec de la mise à jour du statut de la demande"
                  );
                  return res
                    .status(400)
                    .send(
                      "Erreur lors de la mise à jour du statut de la demande"
                    );
                }

                // Supprimer le compte candidat
                candidat.delete(id_can, function (deleteResult) {
                  if (!deleteResult) {
                    console.log("Échec de la suppression du compte candidat");
                    return res
                      .status(400)
                      .send("Erreur lors de la suppression du compte candidat");
                  }

                  console.log("Processus terminé avec succès");
                  return res.redirect("/admin/requests?tab=recrutement");
                });
              }
            );
          }
        );
      });
    });
  }
);

// Route pour rejeter une demande de recrutement
router.post(
  "/request/recrutement/:id_can/:siren/reject",
  function (req, res, next) {
    const id_can = parseInt(req.params.id_can);
    const siren = req.params.siren;

    demandeRecrutement.update(
      id_can,
      siren,
      siren,
      { statutDR: "refusee" },
      function (err, result) {
        if (result) {
          res.redirect("/admin/requests?tab=recrutement");
        } else {
          res
            .status(400)
            .send("Échec de la mise à jour du statut de la demande");
        }
      }
    );
  }
);

// Route pour créer un nouvel administrateur à partir d'un candidat
router.post("/create-admin", async function (req, res, next) {
  const id_candidat = parseInt(req.body.id_candidat);

  try {
    const candidatResult = await new Promise((resolve) =>
      candidat.readById(id_candidat, resolve)
    );

    if (!candidatResult || candidatResult.length === 0) {
      return res.status(404).send("Candidat non trouvé");
    }

    const candidatInfo = candidatResult[0];

    console.log("Informations du candidat:", {
      email: candidatInfo.email,
      nom: candidatInfo.nom,
      prenom: candidatInfo.prenom,
      numero_telephone: candidatInfo.numero_telephone,
    });

    const adminResult = await admin.creat(
      candidatInfo.email,
      candidatInfo.mdp,
      candidatInfo.nom,
      candidatInfo.prenom,
      candidatInfo.numero_telephone,
      "actif"
    );

    if (!adminResult) {
      console.log("Échec de la création du compte administrateur");
      return res
        .status(400)
        .send("Erreur lors de la création du compte administrateur");
    }

    const template = emailTemplates.droitsAdminOctroyes(
      candidatInfo.nom,
      candidatInfo.prenom
    );
    await sendEmail(candidatInfo.email, template);

    const deleteResult = await new Promise((resolve) =>
      candidat.delete(id_candidat, resolve)
    );

    if (!deleteResult) {
      console.log("Échec de la suppression du compte candidat");
      return res
        .status(400)
        .send("Erreur lors de la suppression du compte candidat");
    }

    console.log("Processus terminé avec succès");
    return res.redirect("/admin/dashboard?tab=admins");
  } catch (err) {
    console.error("Erreur dans /create-admin :", err);
    return res.status(500).send("Erreur interne");
  }
});

module.exports = router;
