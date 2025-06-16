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
  res.render("Login", { title: "S'authentifier", inactive });
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
    console.log(req.userLocation);
    const id_can = req.session.id_candidat;
    const {
      type_metier,
      rythme,
      statut_de_poste,
      fourchette_salaire,
      date_validite,
      city,
    } = req.query;

    // Permet d'aller chercher toutes les offres pour lesquelles le candidat ne peut pas postuler et qui sont "publiee"
    const baseTab = `
      SELECT 
        o.numero, o.etat, o.date_validite, o.indication,
        o.nb_pieces_demandees, f.id_fiche, f.intitule,
        f.statut_de_poste, f.responsable_hierarchique,
        f.type_metier, f.lieu_mission, f.rythme,
        f.fourchette_salaire, f.description, f.siren
      FROM Offre_Emploi o
      JOIN Fiche_Poste f ON o.id_fiche = f.id_fiche
      WHERE o.etat = 'publiee'
        AND NOT EXISTS (
          SELECT 1 FROM Candidature c
          WHERE c.num_OE = o.numero
            AND c.id_can  = ?
        )
    `;
    const baseParams = [id_can];

    // Récupération des listes de valeurs dans ma table d'offres triées
    const [typesMetierRows, rythmesRows, statutsRows, salairesRows, datesRows] =
      await Promise.all([
        query(
          `SELECT DISTINCT type_metier FROM (${baseTab}) AS base`,
          baseParams
        ),
        query(`SELECT DISTINCT rythme FROM (${baseTab}) AS base`, baseParams),
        query(
          `SELECT DISTINCT statut_de_poste FROM (${baseTab}) AS base`,
          baseParams
        ),
        query(
          `SELECT DISTINCT fourchette_salaire FROM (${baseTab}) AS base`,
          baseParams
        ),
        query(
          `SELECT DISTINCT DATE_FORMAT(base.date_validite, '%Y-%m-%d') AS date_validite FROM (${baseTab}) AS base`,
          baseParams
        ),
      ]);

    // Construction dynamique des filtres
    const clauses = [];
    const params = [id_can];

    function addFilterCi(field, values) {
      const arr = Array.isArray(values) ? values : [values];
      // on met tout en lowercase côté SQL et JS --> (insensibles à la casse)
      clauses.push(`LOWER(${field}) IN (?)`);
      params.push(arr.map((v) => v.toLowerCase()));
    }

    if (type_metier) addFilterCi("base.type_metier", type_metier);
    if (rythme) addFilterCi("base.rythme", rythme);
    if (statut_de_poste) addFilterCi("base.statut_de_poste", statut_de_poste);
    if (fourchette_salaire)
      addFilterCi("base.fourchette_salaire", fourchette_salaire);
    if (date_validite) addFilterCi("base.date_validite", date_validite);

    const whereFilters = clauses.length ? " AND " + clauses.join(" AND ") : "";

    // Construction requête finale : baseTab + filtres + join Organisation
    const finalSql = `
      SELECT
        base.*,
        org.nom           AS organisation_nom,
        org.siren         AS organisation_siren,
        org.type          AS organisation_type,
        org.siege_social  AS organisation_siege
      FROM (
        ${baseTab}
      ) AS base
      JOIN Organisation org
        ON base.siren = org.siren
      ${whereFilters}
      ORDER BY base.date_validite DESC
    `;
    const rows = await query(finalSql, params);

    // Récupération de toute les villes et distances
    const enriched = await Promise.all(
      rows.map(async (of) => {
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
    );
    console.log("caca1");
    console.log(enriched);

    // Filtrage pour une ville, garder la plus petite distance trouvée
    const cityMap = {};
    enriched.forEach((of) => {
      if (of.ville) {
        const prev = cityMap[of.ville];
        // si première fois, ou distance plus petite, on met à jour
        if (prev === undefined || of.distance < prev) {
          cityMap[of.ville] = of.distance;
        }
      }
    });
    console.log("caca2");
    console.log(cityMap);

    // Transformaion en 1 tableau trié pour les checkbox
    const citiesDistances = Object.entries(cityMap)
      .map(([ville, distance]) => ({ ville, distance }))
      .sort((a, b) => a.distance - b.distance);

    // Filtrage final selon la selection de l'utilisateur
    let offres = enriched;
    if (city) {
      const selection = Array.isArray(city) ? city : [city]; // city peut être un str ou un tableau
      offres = enriched.filter((o) => selection.includes(o.ville)); // on ne garde que les villes dans selection
    }

    console.log("CITIES & DISTANCES ▶", citiesDistances);

    // Renvoi final
    res.render("ListeOffres", {
      title: "Liste des Offres d'Emploi",
      offres,
      citiesDistances,
      typesMetier: typesMetierRows.map((r) => r.type_metier),
      rythmes: rythmesRows.map((r) => r.rythme),
      statutsDePoste: statutsRows.map((r) => r.statut_de_poste),
      fourchettesSalaires: salairesRows.map((r) => r.fourchette_salaire),
      datesPublication: datesRows.map((r) => r.date_validite),
      selectedFilters: req.query,
    });
  } catch (err) {
    next(err);
  }
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
  console.log(password);

  candidat.creat(email, password, nom, prenom, num, statut, (result) => {
    if (!result) {
      return res.send("Erreur lors de l'inscription. Vérifiez vos données !");
    } else {
      res.render("Login", { title: "S'authentifier" });
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

router.post("/postuler", upload.any(), async (req, res) => {
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
        `nom original : ${file.orginalname}, nom de sauvegarde : ${file.filename}`
      );
    });
  } else {
    console.log("auncun fichier uploads");
  }
  res.send("données reçues");
  */
  try {
    if (!req.session.id_candidat) {
      return res.status(403).send("Accès interdit. Veuillez vous connecter.");
    }
    const id_candidat = req.session.id_candidat;
    const numero_offre = parseInt(req.body.numero_offre, 10);

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
    const piecesArray = Array.isArray(pieces) ? pieces : pieces ? [pieces] : [];

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
    return res.status(500).send("Une erreur est survenue lors du traitement.");
  }
});

router.post("/modifier-candidature", upload.any(), async (req, res, next) => {
  const numero_offre = req.body.numero_offre;
  const originalName = JSON.parse(req.body.originalFiles);
  const files = req.files || [];

  if (files.length === 0) {
    return res.redirect(`/offre2/${numero_offre}`);
  }

  try {
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

      // supprime l’ancien fichier si aucune référence
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
});

router.post("/upload", upload.single("file"), (req, res) => {
  // test erreur
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier reçu" });
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
});

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
