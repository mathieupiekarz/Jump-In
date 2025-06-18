var express = require("express");
var router = express.Router();
var db = require("../model/db.js");
var session = require("../session.js");
var upload = require("../multer.js");
var path = require("path");
var fs = require("fs");
var util = require("util");
var query = util.promisify(db.query).bind(db);
var { geocode } = require("../services/geocode.js");
var { calculDistance } = require("../services/distance.js");
var { sendEmail, emailTemplates } = require("../services/email.js");
const { checkFileContent } = require("../security.js");

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
  const inactive = req.session.inactiveAccount === true;
  req.session.inactiveAccount = false;
  res.render("Login", {
    title: "S'authentifier",
    inactive: inactive,
  });
});

router.post("/login", function (req, res, next) {
  const { email, password } = req.body;

  // ADMIN
  admin.read(email, (adminResult) => {
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
      // sinon on continue vers RECRUTEUR
    }

    // RECRUTEUR
    rec.read(email, (recruteurResult) => {
      if (recruteurResult && recruteurResult.length > 0) {
        const recruteur = recruteurResult[0];
        // on récupère le statut en base
        const sqlRec = "SELECT statut FROM Recruteur WHERE id_rec = ?";
        db.query(sqlRec, [recruteur.id_rec], (err, recStatuts) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .redirect(
                "/users/login?error=" + encodeURIComponent("Erreur serveur")
              );
          }

          const statutRec = recStatuts[0].statut;
          if (statutRec === "inactif") {
            // drapeau en session, puis redirection sans query
            req.session.inactiveAccount = true;
            return res.redirect("/users/login");
          }

          if (recruteur.mdp !== password) {
            return res.redirect(
              "/users/login?error=" +
                encodeURIComponent("Email ou mot de passe incorrect")
            );
          }

          // tout est ok
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
        });
      } else {
        // CANDIDAT
        candidat.read(email, (candidatResult) => {
          if (!candidatResult || candidatResult.length === 0) {
            return res.redirect(
              "/users/login?error=" +
                encodeURIComponent("Email ou mot de passe incorrect")
            );
          }

          const candidat = candidatResult[0];
          const sqlCan = "SELECT statut FROM Candidat WHERE id_can = ?";
          db.query(sqlCan, [candidat.id_can], (err, canStatuts) => {
            if (err) {
              console.error(err);
              return res
                .status(500)
                .redirect(
                  "/users/login?error=" + encodeURIComponent("Erreur serveur")
                );
            }

            const statutCan = canStatuts[0].statut;
            if (statutCan === "inactif") {
              req.session.inactiveAccount = true;
              return res.redirect("/users/login");
            }

            if (candidat.mdp !== password) {
              return res.redirect(
                "/users/login?error=" +
                  encodeURIComponent("Email ou mot de passe incorrect")
              );
            }

            session.creatSession(
              req.session,
              {
                id: candidat.id_can,
                email: candidat.email,
              },
              "candidat"
            );
            return res.redirect("/users/ListeOffres");
          });
        });
      }
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

    // Récupérer toutes les organisations actives
    organisation.readall(function (organisations) {
      // Filtrer pour ne garder que les organisations actives
      const activeOrganisations = organisations.filter(
        (org) => org.statut === "active"
      );

      res.render("Profile", {
        title: "Informations Personnelles",
        candidat: result[0],
        successMessage: successMessage,
        organisations: activeOrganisations,
      });
    });
  });
});

/*
router.get("/ListeOffres", function (req, res, next) {
  const id_can = req.session.id_candidat;
  offre.readSansPostuler(id_can, (results) => {
    res.render("ListeOffres", {
      title: "Liste des Offres d'Emploi",
      offres: results,
    });
  });
});
*/

router.get("/ListeOffres", async (req, res, next) => {
  try {
    const uLat = parseFloat(req.query.lat);
    const uLon = parseFloat(req.query.lng);
    const id_can = req.session.id_candidat;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const {
      type_metier,
      rythme,
      statut_de_poste,
      fourchette_salaire,
      date_validite,
      city,
    } = req.query;

    // Récupérer les offres avec pagination
    offre.readSansPostulerPaginated(
      id_can,
      page,
      limit,
      (offres, totalOffres) => {
        if (!offres) {
          return res.render("ListeOffres", {
            title: "Liste des Offres d'Emploi",
            offres: [],
            citiesDistances: [],
            typesMetier: [],
            rythmes: [],
            statutsDePoste: [],
            fourchettesSalaires: [],
            datesPublication: [],
            selectedFilters: req.query,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(totalOffres / limit),
              totalOffres: totalOffres,
            },
          });
        }

        // Récupération des listes de valeurs dans ma table d'offres triées
        Promise.all([
          query(`SELECT DISTINCT f.type_metier 
               FROM Fiche_Poste f 
               JOIN Offre_Emploi o ON f.id_fiche = o.id_fiche 
               WHERE o.etat = 'publiee'`),
          query(`SELECT DISTINCT f.rythme 
               FROM Fiche_Poste f 
               JOIN Offre_Emploi o ON f.id_fiche = o.id_fiche 
               WHERE o.etat = 'publiee'`),
          query(`SELECT DISTINCT f.statut_de_poste 
               FROM Fiche_Poste f 
               JOIN Offre_Emploi o ON f.id_fiche = o.id_fiche 
               WHERE o.etat = 'publiee'`),
          query(`SELECT DISTINCT f.fourchette_salaire 
               FROM Fiche_Poste f 
               JOIN Offre_Emploi o ON f.id_fiche = o.id_fiche 
               WHERE o.etat = 'publiee'`),
          query(`SELECT DISTINCT DATE_FORMAT(o.date_validite, '%Y-%m-%d') AS date_validite 
               FROM Offre_Emploi o 
               WHERE o.etat = 'publiee'`),
        ]).then(
          ([
            typesMetierRows,
            rythmesRows,
            statutsRows,
            salairesRows,
            datesRows,
          ]) => {
            // Récupération de toutes les villes et distances
            Promise.all(
              offres.map(async (of) => {
                let ville = null,
                  distance = Infinity;
                try {
                  const lieu =
                    typeof of.lieu_mission === "string"
                      ? JSON.parse(of.lieu_mission)
                      : of.lieu_mission;
                  ville = lieu.ville;
                  if (ville && uLat != null && uLon != null) {
                    const { lat, lon } = await geocode(ville);
                    distance = calculDistance(uLat, uLon, lat, lon);
                  }
                } catch {}
                return { ...of, ville, distance };
              })
            ).then((enriched) => {
              // Filtrage pour une ville, garder la plus petite distance trouvée
              const cityMap = {};
              enriched.forEach((of) => {
                if (of.ville) {
                  const prev = cityMap[of.ville];
                  if (prev === undefined || of.distance < prev) {
                    cityMap[of.ville] = of.distance;
                  }
                }
              });

              // Transformation en tableau trié pour les checkbox
              const citiesDistances = Object.entries(cityMap)
                .map(([ville, distance]) => ({ ville, distance }))
                .sort((a, b) => a.distance - b.distance);

              // Filtrage final selon la sélection de l'utilisateur
              let filteredOffres = enriched;

              // Filtrage par ville
              if (city) {
                const selection = Array.isArray(city) ? city : [city];
                filteredOffres = filteredOffres.filter((o) =>
                  selection.includes(o.ville)
                );
              }

              // Filtrage par type de métier
              if (type_metier) {
                const selection = Array.isArray(type_metier)
                  ? type_metier
                  : [type_metier];
                filteredOffres = filteredOffres.filter((o) =>
                  selection.includes(o.type_metier)
                );
              }

              // Filtrage par rythme
              if (rythme) {
                const selection = Array.isArray(rythme) ? rythme : [rythme];
                filteredOffres = filteredOffres.filter((o) =>
                  selection.includes(o.rythme)
                );
              }

              // Filtrage par statut de poste
              if (statut_de_poste) {
                const selection = Array.isArray(statut_de_poste)
                  ? statut_de_poste
                  : [statut_de_poste];
                filteredOffres = filteredOffres.filter((o) =>
                  selection.includes(o.statut_de_poste)
                );
              }

              // Filtrage par fourchette de salaire
              if (fourchette_salaire) {
                const selection = Array.isArray(fourchette_salaire)
                  ? fourchette_salaire
                  : [fourchette_salaire];
                filteredOffres = filteredOffres.filter((o) =>
                  selection.includes(o.fourchette_salaire)
                );
              }

              // Filtrage par date de validité
              if (date_validite) {
                const selection = Array.isArray(date_validite)
                  ? date_validite
                  : [date_validite];
                filteredOffres = filteredOffres.filter((o) => {
                  const offreDate = new Date(o.date_validite)
                    .toISOString()
                    .split("T")[0];
                  return selection.includes(offreDate);
                });
              }

              res.render("ListeOffres", {
                title: "Liste des Offres d'Emploi",
                offres: filteredOffres,
                citiesDistances,
                typesMetier: typesMetierRows.map((r) => r.type_metier),
                rythmes: rythmesRows.map((r) => r.rythme),
                statutsDePoste: statutsRows.map((r) => r.statut_de_poste),
                fourchettesSalaires: salairesRows.map(
                  (r) => r.fourchette_salaire
                ),
                datesPublication: datesRows.map((r) => r.date_validite),
                selectedFilters: req.query,
                pagination: {
                  currentPage: page,
                  totalPages: Math.ceil(totalOffres / limit),
                  totalOffres: totalOffres,
                },
              });
            });
          }
        );
      }
    );
  } catch (err) {
    next(err);
  }
});

router.get("/inscription", function (req, res, next) {
  res.render("inscription", { title: "Créer un compte", inactive: false });
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

  candidat.creat(email, password, nom, prenom, num, statut, async (result) => {
    if (!result) {
      return res.send("Erreur lors de l'inscription. Vérifiez vos données !");
    } else {
      // Envoyer l'email de confirmation
      const template = emailTemplates.compteCree(nom, prenom);
      await sendEmail(email, template);

      res.render("Login", {
        title: "S'authentifier",
        inactive: false,
      });
    }
  });
});

router.get("/offre/:id", function (req, res) {
  const numero = req.params.id;
  offre.readWithFicheAndOrganisation(numero, function (result) {
    if (!result || result.length === 0) {
      return res.status(404).send("Offre non trouvée.");
    }

    res.render("OffreDetail", {
      title: "Détail de l'offre",
      offre: result[0],
    });
  });
});

router.get("/offre2/:id", function (req, res, next) {
  const numero = req.params.id;
  offre.readWithFicheAndOrganisation(numero, function (result1) {
    if (!result1 || result1.length === 0) {
      return res.status(404).send("Offre non trouvée.");
    }
    pjt.readByCandidature(req.session.id_candidat, numero, (result2) => {
      if (!result2 || result2.length === 0) {
        return res.status(404).send("Offre non trouvée.");
      }

      res.render("OffreDetail2", {
        title: "Détail de l'offre",
        offre: result1[0],
        pjts: result2,
      });
    });
  });
});

router.post(
  "/postuler",
  upload.any(),
  async (req, res) => {
    /*
  console.log(req.body.email);
  console.log(req.body.telephone);
  console.log(req.body.numero_offre);
  console.log(req.session.id_candidat);

  const pc = req.body.pieceSauvegardee;
  if (Array.isArray(pc)) {
    console.log(pc);
  } else if (pc) {
    console.log(pc);
  } else {
    console.log("aucune piece trouvée");
  }

  if (req.files && req.files.length > 0) {
    console.log("fichiers uploadés :");
    req.files.forEach((file, i) => {
      console.log(
        `nom original : ${file.originalname}, nom de sauvegarde : ${file.filename}`
      );
    });
  } else {
    console.log("auncun fichier uploads");
  }
  res.send("données reçues");
  */
    try {
      console.log(req.file);

      if (!req.session.id_candidat) {
        return res.status(403).send("Accès interdit. Veuillez vous connecter.");
      }
      const id_candidat = req.session.id_candidat;
      const numero_offre = parseInt(req.body.numero_offre, 10);

      // vérification du contenu des fichiers envoyés
      const fichiersDangereux = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          if (checkFileContent(file.path)) {
            fichiersDangereux.push(file.path);
          }
        }
      }

      // Si des fichiers sont suspects, les supprimer et stopper le traitement
      if (fichiersDangereux.length > 0) {
        for (const filePath of fichiersDangereux) {
          fs.unlink(filePath, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error("Erreur suppression fichier suspect :", err);
            }
          });
        }
        return res.status(400).send({
          message: "Un ou plusieurs fichiers contiennent du contenu interdit.",
        });
      }

      // création candidature
      const result = await new Promise((resolve) => {
        candidature.creat(id_candidat, numero_offre, resolve);
      });
      if (!result) {
        return res.send(
          "Erreur lors de la candidature. Vous avez peut-être déjà postulé à cette offre"
        );
      }

      // enregistrement des pièces sauvegardées
      const pieces = req.body.pieceSauvegardee;
      const piecesArray = Array.isArray(pieces)
        ? pieces
        : pieces
        ? [pieces]
        : [];

      for (const piece of piecesArray) {
        await new Promise((resolve, reject) => {
          pjt.creat(
            piece,
            piece.split(".").pop(),
            id_candidat,
            numero_offre,
            (r) => {
              if (r) resolve();
              else {
                reject(
                  new Error(`Échec enregistrement pièce sauvegardée : ${piece}`)
                );
              }
            }
          );
        });
      }

      // enregistrement des fichiers uploadés
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await new Promise((resolve, reject) => {
            pjt.creat(
              file.filename,
              file.filename.split(".").pop(),
              id_candidat,
              numero_offre,
              (r) =>
                r ? resolve() : reject("Erreur enregistrement fichier uploadé")
            );
          });
        }
      }
      return res.redirect("/users/ListeOffres");
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("Une erreur est survenue lors du traitement.");
    }
  },
  (err, req, res, next) => {
    if (err.code === "EXTENSION_NON_AUTORISEE") {
      return res
        .status(400)
        .json({ code: "EXTENSION_NON_AUTORISEE", message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        code: "LIMIT_FILE_SIZE",
        message: "Fichier trop volumineux (> 5 Ko)",
      });
    }
    return res
      .status(400)
      .json({ code: "UPLOAD_ERROR", message: "Erreur inconnue" });
  }
);

router.post(
  "/modifier-candidature",
  upload.any(),
  async (req, res, next) => {
    const numero_offre = req.body.numero_offre;
    const originalName = JSON.parse(req.body.originalFiles);
    const files = req.files || [];

    if (files.length === 0) {
      return res.redirect(`/offre2/${numero_offre}`);
    }

    try {
      // vérification du contenu des fichiers envoyés
      const fichiersDangereux = [];

      for (const file of files) {
        if (checkFileContent(file.path)) {
          fichiersDangereux.push(file.path);
        }
      }

      if (fichiersDangereux.length > 0) {
        // Suppression des fichiers suspects
        for (const filePath of fichiersDangereux) {
          fs.unlink(filePath, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error("Erreur suppression fichier suspect :", err);
            }
          });
        }
        return res.status(400).send({
          message: "Un ou plusieurs fichiers contiennent du contenu interdit.",
        });
      }

      for (let i = 0; i < files.length; i++) {
        // on récupère le chemin de l'ancien fichier
        const file = files[i];
        const oldName = originalName[i];
        const newName = file.filename;
        const newType = path.extname(newName).slice(1);

        // mise à jour de la base
        await new Promise((resolve, reject) => {
          pjt.update(
            oldName,
            req.session.id_candidat,
            numero_offre,
            { nom: newName, type: newType },
            (affectedRows) => {
              if (!affectedRows) {
                return reject(new Error("Erreur update DB pour " + oldName));
              }
              resolve();
            }
          );
        });

        // on compte les références restantes de l'ancien fichier
        const count = await new Promise((resolve, reject) => {
          pjt.countByName(oldName, (err, cnt) => {
            if (err) return reject(err);
            resolve(cnt);
          });
        });

        // supprime l'ancien fichier si aucune référence
        if (count === 0) {
          const oldPath = path.join(__dirname, "../uploads", oldName);
          fs.unlink(oldPath, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error("Erreur suppr. ancien fichier:", err);
            }
          });
        }
      }
      // on redirige
      res.redirect(`/users/offre2/${numero_offre}`);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("Une erreur est survenue lors de la modification.");
    }
  },
  (err, req, res, next) => {
    if (err.code === "EXTENSION_NON_AUTORISEE") {
      return res
        .status(400)
        .json({ code: "EXTENSION_NON_AUTORISEE", message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        code: "LIMIT_FILE_SIZE",
        message: "Fichier trop volumineux (> 5 Ko)",
      });
    }
    return res
      .status(400)
      .json({ code: "UPLOAD_ERROR", message: "Erreur inconnue" });
  }
);

router.post(
  "/upload",
  upload.single("file"),
  (req, res) => {
    // test erreur
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu" });
    }

    // vérification du contenu des fichiers envoyés
    const filePath = req.file.path;
    if (checkFileContent(filePath)) {
      // Supprime le fichier s'il est suspect
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Erreur suppression fichier suspect :", err);
        }
      });

      return res
        .status(400)
        .json({ message: "Le fichier contient du contenu interdit." });
    }

    pjd.creat(
      req.file.filename,
      path.extname(req.file.originalname).toLowerCase().slice(1),
      req.session.id_candidat,
      (resultat) => {
        if (!resultat) {
          return res.status(400).json({
            success: false,
            message: "Échec de l'enregistrement du document.",
          });
        }
        res.json({
          success: true,
          message: "Fichier reçu",
          filename: req.file.filename,
        });
      }
    );
  },
  (err, req, res, next) => {
    if (err.code === "EXTENSION_NON_AUTORISEE") {
      return res
        .status(400)
        .json({ code: "EXTENSION_NON_AUTORISEE", message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        code: "LIMIT_FILE_SIZE",
        message: "Fichier trop volumineux (> 5 Ko)",
      });
    }
    return res
      .status(400)
      .json({ code: "UPLOAD_ERROR", message: "Erreur inconnue" });
  }
);

router.get("/pieces-jointes", (req, res, next) => {
  const id_can = req.session.id_candidat;
  if (!id_can) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  const sql = "SELECT nom FROM Piece_Jointe_Durable WHERE id_can = ?";
  db.query(sql, [id_can], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Erreur Serveur" });
    }
    res.json(results);
  });
});

router.post("/supprimerCandidature/:numero", async (req, res, next) => {
  const id_can = req.session.id_candidat;
  const numero_offre = parseInt(req.params.numero, 10);

  if (!id_can) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  try {
    // Récupération des noms de fichiers avant suppression
    const oldFiles = await new Promise((resolve, reject) => {
      const sql =
        "SELECT nom FROM Piece_Jointe_Temporaire WHERE id_can = ? AND num_OE = ?";
      db.query(sql, [id_can, numero_offre], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map((r) => r.nom));
      });
    });

    // Suppression de la candidature
    const deleteCount = await new Promise((resolve, reject) => {
      candidature.delete(id_can, numero_offre, (err, affectedRows) => {
        if (err) return reject(err);
        resolve(affectedRows);
      });
    });
    if (!deleteCount) {
      return res.status(404).send("Candidature introuvable ou déjà supprimée.");
    }

    // Pour chaque ancien fichier, vérifier références restantes
    for (const nom of oldFiles) {
      // count dans la table temporaire
      const tempCount = await new Promise((resolve, reject) => {
        pjt.countByName(nom, (err, cnt) => {
          if (err) return reject(err);
          resolve(cnt);
        });
      });
      // count dans la table durable
      const durCount = await new Promise((resolve, reject) => {
        pjd.countByName(nom, (err, cnt) => {
          if (err) return reject(err);
          resolve(cnt);
        });
      });

      // Suppression physique si plus aucune référence
      if (tempCount === 0 && durCount === 0) {
        const filePath = path.join(__dirname, "../uploads", nom);
        fs.unlink(filePath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Erreur suppression fichier :", err);
          }
        });
      }
    }

    return res.redirect("/users/ListeOffres");
  } catch (err) {
    console.error("Erreur suppression candidature :", err);
    next(err);
  }
});

router.get("/MesOffres", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.status(403).send("Accès interdit. Veuillez vous connecter.");
  }

  const id_candidat = req.session.id_candidat;

  candidature.readCandidaturesWithOffreDetails(id_candidat, (offres) => {
    res.render("MesOffres", {
      title: "Mes candidatures",
      offres: offres || [], // Si offres est null, on utilise un tableau vide
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
    return res.redirect("/users/login");
  }

  const { siren, description } = req.body;

  // Vérifications basiques
  if (!siren || !description || description.length < 10) {
    req.session.errorMessage =
      "Veuillez remplir tous les champs correctement (description minimum 10 caractères)";
    return res.redirect("/users/Profile");
  }

  // Vérifier que le candidat existe
  candidat.readById(req.session.id_candidat, function (candidatResult) {
    if (!candidatResult || candidatResult.length === 0) {
      return res.redirect("/users/login");
    }

    // Créer la demande de recruteur
    demandeR.creat(
      req.session.id_candidat,
      siren,
      description,
      "en_attente",
      (result) => {
        if (!result) {
          req.session.errorMessage =
            "Une erreur est survenue lors de la création de la demande. Vous avez peut-être déjà fait une demande pour cette organisation.";
          return res.redirect("/users/Profile");
        }
        req.session.successMessage =
          "Votre demande a été envoyée avec succès !";
        res.redirect("/users/Profile");
      }
    );
  });
});

router.post("/demande-creation-organisation", function (req, res, next) {
  if (!req.session.id_candidat) {
    return res.redirect("/users/login");
  }

  const {
    siren,
    description,
    nom,
    type,
    siege_nom,
    siege_adresse,
    siege_complement,
    siege_code_postal,
    siege_ville,
    siege_pays,
  } = req.body;

  // Vérifications basiques
  if (
    !siren ||
    !description ||
    !nom ||
    !type ||
    !siege_nom ||
    !siege_adresse ||
    !siege_code_postal ||
    !siege_ville ||
    !siege_pays
  ) {
    req.session.errorMessage = "Veuillez remplir tous les champs obligatoires";
    return res.redirect("/users/Profile");
  }

  if (description.length < 10) {
    req.session.errorMessage =
      "La description doit contenir au moins 10 caractères";
    return res.redirect("/users/Profile");
  }

  // Création de l'objet siège social
  const siege_social = {
    nom: siege_nom,
    adresse: siege_adresse,
    complement: siege_complement || null,
    code_postal: siege_code_postal,
    ville: siege_ville,
    pays: siege_pays,
  };

  // Vérifier que le candidat existe
  candidat.readById(req.session.id_candidat, function (candidatResult) {
    if (!candidatResult || candidatResult.length === 0) {
      return res.redirect("/users/login");
    }

    // Créer la demande de création d'organisation
    demandeCrO.creat(
      req.session.id_candidat,
      siren,
      description,
      "en_attente",
      nom,
      type,
      siege_social,
      (result) => {
        if (!result) {
          req.session.errorMessage =
            "Une erreur est survenue lors de la création de la demande. Vous avez peut-être déjà fait une demande pour cette organisation ou le SIREN existe déjà.";
          return res.redirect("/users/Profile");
        }
        req.session.successMessage =
          "Votre demande de création d'organisation a été envoyée avec succès !";
        res.redirect("/users/Profile");
      }
    );
  });
});

module.exports = router;
