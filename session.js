var sessions = require("express-session");
module.exports = {
  init: () => {
    return sessions({
      secret: process.env.SESSION_SECRET,
      saveUninitialized: true,
      cookie: { maxAge: 3600 * 1000 }, // 60 minutes
      resave: false,
    });
  },

  creatSession: function (session, userData, role) {
    session.userid = userData.id;
    session.role = role;
    session.email = userData.email;

    // Stocker des informations spécifiques selon le rôle
    if (role === "recruteur") {
      session.id_rec = userData.id;
      session.siren = userData.siren;
    } else if (role === "admin") {
      session.id_admin = userData.id;
    } else if (role === "candidat") {
      session.id_candidat = userData.id;
    }

    session.save(function (err) {
      if (err)
        console.error("Erreur lors de la sauvegarde de la session:", err);
    });
    return session;
  },

  isConnected: (session, role) => {
    if (!session.userid || session.userid === undefined) return false;
    if (role && session.role !== role) return false;
    return true;
  },

  hasAccess: (session, path) => {
    // Vérifier si l'utilisateur est connecté
    if (!session.userid) return false;

    // Définir les chemins autorisés pour chaque rôle
    const adminPaths = ["/admin"];
    const recruteurPaths = ["/recruteur"];
    const candidatPaths = ["/users", "/candidat"];

    // Vérifier l'accès selon le rôle
    if (session.role === "admin") {
      return adminPaths.some((p) => path.startsWith(p));
    } else if (session.role === "recruteur") {
      // Pour les recruteurs, vérifier aussi le SIREN
      if (path.startsWith("/recruteur")) {
        const sirenMatch = path.match(/^\/recruteur\/(\d{9})/);
        if (sirenMatch) {
          return sirenMatch[1] === session.siren;
        }
      }
      return recruteurPaths.some((p) => path.startsWith(p));
    } else if (session.role === "candidat") {
      return candidatPaths.some((p) => path.startsWith(p));
    }

    return false;
  },

  deleteSession: function (session) {
    session.destroy();
  },
};
