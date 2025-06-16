var express = require("express");
var router = express.Router();
var db = require("../model/db.js");
var path = require("path");
var archiver = require("archiver");

var organisation = require("../model/organisation.js");
var offre = require("../model/offre_emploi.js");
var candidature = require("../model/candidature.js");
var fp = require("../model/fiche_poste.js");
var rec = require("../model/recruteur.js");
var dcho = require("../model/Demande_changer_organisation.js");
var pjt = require("../model/piece_jointe_temporaire.js");

// Route pour afficher les offres d'une organisation spécifique
router.get("/:entreprise_id/NosOffres", function (req, res, next) {
  const siren = req.params.entreprise_id;

  // Vérifier si l'organisation existe
  organisation.read(siren, function (orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Utiliser des promesses pour récupérer les offres et les fiches de poste en parallèle
    const getOffres = new Promise((resolve) => {
      offre.readAllByOrganisationValide(siren, (results) => {
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
          organisation: orgResult[0],
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des données:", error);
        res.status(500).send("Erreur serveur");
      });
  });
});

// Route pour voir les candidats d'une offre spécifique
router.get(
  "/:entreprise_id/offre/:offre_id/candidats",
  function (req, res, next) {
    const siren = req.params.entreprise_id;
    const offre_id = req.params.offre_id;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Récupérer les détails de l'offre avec la fiche de poste
      offre.readWithFicheAndOrganisation(
        parseInt(offre_id),
        function (offreResult) {
          if (!offreResult || offreResult.length === 0) {
            return res.status(404).send("Offre non trouvée.");
          }

          // Récupérer toutes les candidatures pour cette offre
          candidature.readByOffreWithCandidat(
            parseInt(offre_id),
            function (candidatures) {
              res.render("OffreCandidatures", {
                title: "Candidatures - " + offreResult[0].intitule,
                offre: offreResult[0],
                organisation: orgResult[0],
                candidatures: candidatures,
              });
            }
          );
        }
      );
    });
  }
);

router.get("/downloadCandidature/:numero/:id_can", async (req, res, next) => {
  const id_can = parseInt(req.params.id_can, 10);
  const numero = parseInt(req.params.numero, 10);
  try {
    // Récupération de tous les noms de fichiers temporaires
    const files = await new Promise((resolve, reject) => {
      pjt.readByCandidature(id_can, numero, (results) => {
        if (!Array.isArray(results)) {
          // en cas d'erreur interne, on considère qu'il n'y a rien
          return resolve([]);
        }
        resolve(results.map((r) => r.nom));
      });
    });
    if (files.length === 0) {
      return res.status(404).send("Aucune pièce à télécharger");
    }

    // Préparer la réponse http en tant que zip
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="candidature-${numero}-${id_can}.zip"`
    );
    res.setHeader("Content-Type", "application/zip");

    // Création archive + stream
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => next(err));
    archive.pipe(res);

    // Ajout des fichiers à l'archive
    const uploadDir = path.join(__dirname, "../uploads");
    for (const nom of files) {
      const fullPath = path.join(uploadDir, nom);
      archive.file(fullPath, { name: nom });
    }

    // Finaliser l'envoi
    await archive.finalize();
  } catch (err) {
    console.error("Erreur ZIP candidature :", err);
    next(err);
  }
});

// Route pour modifier une offre
router.post(
  "/:entreprise_id/offre/:offre_id/modifier",
  function (req, res, next) {
    const siren = req.params.entreprise_id;
    const offre_id = req.params.offre_id;
    const { etat, date_validite, indication, nb_pieces_demandees } = req.body;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Créer l'objet de mise à jour avec les champs modifiés
      const updateData = {
        etat: etat,
        date_validite: date_validite,
        indication: indication || null,
        nb_pieces_demandees: parseInt(nb_pieces_demandees),
      };

      // Mettre à jour l'offre
      offre.update(parseInt(offre_id), updateData, function (result) {
        if (!result) {
          return res
            .status(400)
            .send(
              "Erreur lors de la modification de l'offre. Veuillez vérifier les données saisies."
            );
        }
        // Rediriger vers la page des offres
        res.redirect(`/recruteur/${siren}/NosOffres`);
      });
    });
  }
);

// Route pour supprimer une offre
router.post(
  "/:entreprise_id/offre/:offre_id/supprimer",
  function (req, res, next) {
    const siren = req.params.entreprise_id;
    const offre_id = req.params.offre_id;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Supprimer l'offre
      offre.delete(parseInt(offre_id), function (result) {
        if (!result) {
          return res
            .status(400)
            .send(
              "Erreur lors de la suppression de l'offre. L'offre n'existe peut-être pas."
            );
        }
        // Rediriger vers la page des offres
        res.redirect(`/recruteur/${siren}/NosOffres`);
      });
    });
  }
);

// Route pour modifier une fiche de poste
router.post(
  "/:entreprise_id/fiche/:fiche_id/modifier",
  function (req, res, next) {
    const siren = req.params.entreprise_id;
    const fiche_id = req.params.fiche_id;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Vérifier si la fiche de poste existe et appartient à l'organisation
      fp.read(parseInt(fiche_id), function (ficheResult) {
        if (!ficheResult || ficheResult.length === 0) {
          return res.status(404).send("Fiche de poste non trouvée.");
        }

        if (ficheResult[0].siren !== siren) {
          return res
            .status(403)
            .send("Vous n'avez pas accès à cette fiche de poste.");
        }

        // Reconstruire l'objet lieu_mission
        const lieuMission = {
          nom: req.body["lieu_mission[nom]"],
          adresse: req.body["lieu_mission[adresse]"],
          complement: req.body["lieu_mission[complement]"] || null,
          code_postal: req.body["lieu_mission[code_postal]"],
          ville: req.body["lieu_mission[ville]"],
          pays: req.body["lieu_mission[pays]"] || "France",
        };

        // Créer l'objet de mise à jour avec les champs modifiés
        const updateData = {
          intitule: req.body.intitule,
          statut_de_poste: req.body.statut_de_poste,
          responsable_hierarchique: req.body.responsable_hierarchique,
          type_metier: req.body.type_metier,
          lieu_mission: lieuMission,
          rythme: req.body.rythme,
          fourchette_salaire: req.body.fourchette_salaire,
          description: req.body.description,
        };

        // Mettre à jour la fiche de poste
        fp.update(parseInt(fiche_id), updateData, function (result) {
          if (!result) {
            return res
              .status(400)
              .send(
                "Erreur lors de la modification de la fiche de poste. Veuillez vérifier les données saisies."
              );
          }
          // Rediriger vers la page des offres
          res.redirect(`/recruteur/${siren}/NosOffres`);
        });
      });
    });
  }
);

// Route pour supprimer une fiche de poste
router.post(
  "/:entreprise_id/fiche/:fiche_id/supprimer",
  function (req, res, next) {
    const siren = req.params.entreprise_id;
    const fiche_id = req.params.fiche_id;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Vérifier si la fiche de poste existe et appartient à l'organisation
      fp.read(parseInt(fiche_id), function (ficheResult) {
        if (!ficheResult || ficheResult.length === 0) {
          return res.status(404).send("Fiche de poste non trouvée.");
        }

        if (ficheResult[0].siren !== siren) {
          return res
            .status(403)
            .send("Vous n'avez pas accès à cette fiche de poste.");
        }

        // Supprimer la fiche de poste
        fp.delete(parseInt(fiche_id), function (result) {
          if (!result) {
            return res
              .status(400)
              .send("Erreur lors de la suppression de la fiche de poste.");
          }
          // Rediriger vers la page des offres
          res.redirect(`/recruteur/${siren}/NosOffres`);
        });
      });
    });
  }
);

// Route pour afficher le formulaire de création d'une fiche de poste
router.get("/:entreprise_id/fiche/creer", function (req, res, next) {
  const siren = req.params.entreprise_id;

  // Vérifier si l'organisation existe
  organisation.read(siren, function (orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    res.render("CreerFichePoste", {
      title: "Créer une fiche de poste",
      organisation: orgResult[0],
    });
  });
});

// Route pour traiter la création d'une fiche de poste
router.post("/:entreprise_id/fiche/creer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const {
    intitule,
    statut_de_poste,
    responsable_hierarchique,
    type_metier,
    rythme,
    fourchette_salaire,
    description,
  } = req.body;

  // Reconstruire l'objet lieu_mission
  const lieuMission = {
    nom: req.body["lieu_mission[nom]"],
    adresse: req.body["lieu_mission[adresse]"],
    complement: req.body["lieu_mission[complement]"] || null,
    code_postal: req.body["lieu_mission[code_postal]"],
    ville: req.body["lieu_mission[ville]"],
    pays: req.body["lieu_mission[pays]"] || "France",
  };

  // Vérifier si l'organisation existe
  organisation.read(siren, function (orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).send("Organisation non trouvée.");
    }

    // Créer la fiche de poste
    fp.creat(
      intitule,
      statut_de_poste,
      responsable_hierarchique,
      type_metier,
      lieuMission,
      rythme,
      fourchette_salaire,
      description,
      siren,
      function (result) {
        if (!result) {
          return res
            .status(400)
            .send(
              "Erreur lors de la création de la fiche de poste. Veuillez vérifier les données saisies."
            );
        }
        // Rediriger vers la page des offres
        res.redirect(`/recruteur/${siren}/NosOffres`);
      }
    );
  });
});

// Route pour traiter la création d'une offre d'emploi
router.post("/:entreprise_id/offre/creer", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const { id_fiche, etat, date_validite, indication, nb_pieces_demandees } =
    req.body;

  // Vérifier si l'organisation existe
  organisation.read(siren, function (orgResult) {
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
      function (result) {
        if (!result) {
          return res
            .status(400)
            .send(
              "Erreur lors de la création de l'offre. Veuillez vérifier les données saisies."
            );
        }
        // Rediriger vers la page des offres
        res.redirect(`/recruteur/${siren}/NosOffres`);
      }
    );
  });
});

// Route pour traiter la création d'une offre à partir d'une fiche
router.post(
  "/:entreprise_id/fiche/:fiche_id/creer-offre",
  function (req, res, next) {
    const siren = req.params.entreprise_id;
    const fiche_id = req.params.fiche_id;
    const { etat, date_validite, indication, nb_pieces_demandees } = req.body;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Vérifier si la fiche de poste existe et appartient à l'organisation
      fp.read(parseInt(fiche_id), function (ficheResult) {
        if (!ficheResult || ficheResult.length === 0) {
          return res.status(404).send("Fiche de poste non trouvée.");
        }

        if (ficheResult[0].siren !== siren) {
          return res
            .status(403)
            .send("Vous n'avez pas accès à cette fiche de poste.");
        }

        // Créer l'offre d'emploi
        offre.creat(
          etat,
          date_validite,
          indication || null,
          parseInt(nb_pieces_demandees),
          parseInt(fiche_id),
          function (result) {
            if (!result) {
              return res
                .status(400)
                .send(
                  "Erreur lors de la création de l'offre. Veuillez vérifier les données saisies."
                );
            }
            // Rediriger vers la page des offres
            res.redirect(`/recruteur/${siren}/NosOffres`);
          }
        );
      });
    });
  }
);

// Route API pour récupérer les données d'une offre
router.get("/:entreprise_id/offre/:offre_id/api", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const offre_id = req.params.offre_id;

  offre.readWithFicheAndOrganisation(
    parseInt(offre_id),
    function (offreResult) {
      if (!offreResult || offreResult.length === 0) {
        return res.status(404).json({ error: "Offre non trouvée." });
      }
      res.json(offreResult[0]);
    }
  );
});

// Route API pour récupérer les données d'une fiche de poste
router.get("/:entreprise_id/fiche/:fiche_id/api", function (req, res, next) {
  const siren = req.params.entreprise_id;
  const fiche_id = req.params.fiche_id;

  // Vérifier si l'organisation existe
  organisation.read(siren, function (orgResult) {
    if (!orgResult || orgResult.length === 0) {
      return res.status(404).json({ error: "Organisation non trouvée." });
    }

    // Récupérer les données de la fiche de poste
    fp.read(parseInt(fiche_id), function (ficheResult) {
      if (!ficheResult || ficheResult.length === 0) {
        return res.status(404).json({ error: "Fiche de poste non trouvée." });
      }

      if (ficheResult[0].siren !== siren) {
        return res
          .status(403)
          .json({ error: "Vous n'avez pas accès à cette fiche de poste." });
      }

      res.json(ficheResult[0]);
    });
  });
});

// Route pour afficher la page Mon Compte
router.get("/mon-compte", function (req, res, next) {
  // Vérifier si l'utilisateur est connecté
  if (!req.session.id_rec) {
    return res.redirect("/login");
  }

  // Récupérer les informations du recruteur
  rec.readById(req.session.id_rec, function (recruteurResult) {
    if (!recruteurResult || recruteurResult.length === 0) {
      return res.status(404).send("Recruteur non trouvé.");
    }

    const siren = recruteurResult[0].siren;

    // Vérifier si l'organisation existe
    organisation.read(siren, function (orgResult) {
      if (!orgResult || orgResult.length === 0) {
        return res.status(404).send("Organisation non trouvée.");
      }

      // Récupérer toutes les organisations pour le select
      organisation.readall(function (allOrgs) {
        // Filtrer pour exclure l'organisation actuelle
        const otherOrgs = allOrgs.filter((org) => org.siren !== siren);

        // Préparer les données pour la vue
        const viewData = {
          title: "Mon Compte",
          organisation: orgResult[0],
          recruteur: recruteurResult[0],
          organisations: otherOrgs,
        };

        res.render("CompteRecruteur", viewData);
      });
    });
  });
});

// Route pour demander un changement d'organisation
router.post("/changer-organisation", function (req, res, next) {
  if (!req.session.id_rec) {
    return res.redirect("/login");
  }

  const { nouveau_siren, description } = req.body;

  // Vérifications basiques
  if (!nouveau_siren || !description || description.length < 10) {
    return res.redirect("/recruteur/mon-compte");
  }

  // Vérifier que le recruteur existe et récupérer son SIREN actuel
  rec.readById(req.session.id_rec, function (recruteurResult) {
    if (!recruteurResult || recruteurResult.length === 0) {
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
