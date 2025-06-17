var express = require("express");
var router = express.Router();
var db = require("../model/db.js");
var session = require("../session.js");

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
      demandeCreation.readall((results) => {
        resolve(results);
      });
    }),

    getDemandesChangement: new Promise((resolve) => {
      demandeChangement.readall((results) => {
        resolve(results);
      });
    }),

    getDemandesRecrutement: new Promise((resolve) => {
      demandeRecrutement.readall((results) => {
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
  function (req, res, next) {
    const id_can = parseInt(req.params.id_can);
    const siren = req.params.siren;

    // 1. Récupérer les informations de la demande
    demandeCreation.read(id_can, siren, function (demandeResult) {
      if (!demandeResult || demandeResult.length === 0) {
        return res.status(404).send("Demande non trouvée");
      }

      const demande = demandeResult[0];
      console.log("Informations de la demande:", demande);

      // Parser le JSON du siège social
      let siege_social;
      try {
        siege_social = JSON.parse(demande.siege_social);
      } catch (error) {
        console.error("Erreur lors du parsing du siège social:", error);
        return res.status(400).send("Format de siège social invalide");
      }

      // 2. Récupérer les informations du candidat
      candidat.readById(id_can, function (candidatResult) {
        if (!candidatResult || candidatResult.length === 0) {
          return res.status(404).send("Candidat non trouvé");
        }

        const candidatInfo = candidatResult[0];
        console.log("Informations du candidat:", candidatInfo);

        // 3. Créer l'organisation
        organisation.creat(
          siren,
          demande.nom,
          demande.type,
          siege_social,
          "active",
          function (orgResult) {
            if (orgResult === null) {
              console.log("Échec de la création de l'organisation");
              return res
                .status(400)
                .send("Erreur lors de la création de l'organisation");
            }

            console.log("Organisation créée avec succès:", orgResult);

            // 4. Créer le compte recruteur
            recruteur.creat(
              siren,
              candidatInfo.email,
              candidatInfo.mdp,
              candidatInfo.nom,
              candidatInfo.prenom,
              candidatInfo.numero_telephone,
              "actif",
              function (recruteurResult) {
                if (!recruteurResult) {
                  console.log("Échec de la création du compte recruteur");
                  return res
                    .status(400)
                    .send("Erreur lors de la création du compte recruteur");
                }

                console.log(
                  "Compte recruteur créé avec succès:",
                  recruteurResult
                );

                // 5. Mettre à jour le statut de la demande
                demandeCreation.update(
                  id_can,
                  siren,
                  { statutCrO: "validee" },
                  function (updateResult) {
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

                    console.log(
                      "Statut de la demande mis à jour:",
                      updateResult
                    );

                    // 6. Supprimer le compte candidat
                    candidat.delete(id_can, function (deleteResult) {
                      if (!deleteResult) {
                        console.log(
                          "Échec de la suppression du compte candidat"
                        );
                        return res
                          .status(400)
                          .send(
                            "Erreur lors de la suppression du compte candidat"
                          );
                      }

                      console.log(
                        "Compte candidat supprimé avec succès:",
                        deleteResult
                      );
                      return res.redirect("/admin/requests?tab=creation");
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
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
      (result) => {
        if (result) {
          res.redirect("/admin/requests?tab=creation");
        } else {
          res
            .status(400)
            .send("Échec de la mise à jour du statut de la demande");
        }
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

    // 1. Mettre à jour le statut de la demande
    demandeChangement.update(
      id_rec,
      siren,
      siren,
      { statutChO: "validee" },
      (updateResult) => {
        if (updateResult) {
          // 2. Mettre à jour le SIREN du recruteur
          recruteur.readById(id_rec, (recruteurInfo) => {
            if (recruteurInfo && recruteurInfo.length > 0) {
              recruteur.update(
                id_rec,
                { siren: siren },
                (updateRecruteurResult) => {
                  res.redirect("/admin/requests?tab=changement");
                }
              );
            } else {
              res.status(404).send("Recruteur non trouvé");
            }
          });
        } else {
          res
            .status(400)
            .send("Échec de la mise à jour du statut de la demande");
        }
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
      (result) => {
        if (result) {
          res.redirect("/admin/requests?tab=changement");
        } else {
          res
            .status(400)
            .send("Échec de la mise à jour du statut de la demande");
        }
      }
    );
  }
);

// Route pour activer/désactiver un candidat
router.post("/candidat/:id/toggleStatus", function (req, res, next) {
  const id = parseInt(req.params.id);
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
  const id = parseInt(req.params.id);
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
  const id = parseInt(req.params.id);
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

// Route pour approuver une demande de recrutement
router.post(
  "/request/recrutement/:id_can/:siren/approve",
  function (req, res, next) {
    const id_can = parseInt(req.params.id_can);
    const siren = req.params.siren;

    // 1. Récupérer les informations du candidat
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

        // 2. Créer le compte recruteur
        recruteur.creat(
          siren,
          candidatInfo.email,
          candidatInfo.mdp,
          candidatInfo.nom,
          candidatInfo.prenom,
          candidatInfo.numero_telephone,
          "actif",
          function (recruteurResult) {
            if (!recruteurResult) {
              console.log("Échec de la création du compte recruteur");
              return res
                .status(400)
                .send("Erreur lors de la création du compte recruteur");
            }

            // 3. Mettre à jour le statut de la demande
            demandeRecrutement.update(
              id_can,
              siren,
              siren,
              { statutDR: "validee" },
              function (updateResult) {
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

                // 4. Supprimer le compte candidat
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
      function (result) {
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
router.post("/create-admin", function (req, res, next) {
  const id_candidat = parseInt(req.body.id_candidat);

  // 1. Récupérer les informations du candidat
  candidat.readById(id_candidat, function (candidatResult) {
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

    // 2. Créer le compte administrateur
    admin.creat(
      candidatInfo.email,
      candidatInfo.mdp,
      candidatInfo.nom,
      candidatInfo.prenom,
      candidatInfo.numero_telephone,
      "actif",
      function (adminResult) {
        if (!adminResult) {
          console.log("Échec de la création du compte administrateur");
          return res
            .status(400)
            .send("Erreur lors de la création du compte administrateur");
        }

        // 3. Supprimer le compte candidat
        candidat.delete(id_candidat, function (deleteResult) {
          if (!deleteResult) {
            console.log("Échec de la suppression du compte candidat");
            return res
              .status(400)
              .send("Erreur lors de la suppression du compte candidat");
          }

          console.log("Processus terminé avec succès");
          return res.redirect("/admin/dashboard?tab=admins");
        });
      }
    );
  });
});

module.exports = router;
