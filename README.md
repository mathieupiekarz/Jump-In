# Jump'In – Plateforme de Recrutement

## Présentation

Jump'In est une plateforme de recrutement collaborative développée en Node.js/Express, avec des vues dynamiques EJS, une base de données MySQL, et une architecture modulaire respectant les bonnes pratiques de développement web.  
Le projet permet la gestion des offres d'emploi, des fiches de poste, des candidatures, des comptes utilisateurs (candidats, recruteurs, administrateurs) et des organisations.

---

## Organisation du dépôt

```
projet-sr10/
│
├── app.js                  # Point d'entrée principal de l'application Express
├── bin/
│   └── www                 # Lancement du serveur HTTP
├── model/                  # Modèles d'accès à la base de données (une entité = un fichier)
│   └── *.js
├── routes/                 # Définition des routes (contrôleurs) pour chaque rôle/fonctionnalité
│   └── *.js
├── views/                  # Vues EJS (pages dynamiques)
│   ├── *.ejs
│   └── partials/           # Fragments réutilisables
├── public/                 # Fichiers statiques (CSS, images, JS)
│   ├── stylesheets/
│   ├── images/
│   └── javascripts/
├── services/               # Services utilitaires (email, géocodage, calculs)
│   └── *.js
├── test/                   # Tests unitaires et d'intégration (Jest)
│   └── *.test.js
├── uploads/                # Fichiers uploadés par les utilisateurs
├── coverage/               # Rapport de couverture de tests
├── session.js              # Gestion des sessions utilisateurs
├── multer.js               # Configuration de l'upload de fichiers
├── security.js             # Fonctions de sécurité (vérification fichiers, etc.)
├── package.json            # Dépendances et scripts NPM
├── Note_de_Clarification.txt # Spécifications et exemples de données
└── SQL insertion exemples.txt # Exemples d'insertion SQL pour la BDD
```

---

## Améliorations apportées aux livrables précédents

Le projet a connu de nombreuses évolutions et améliorations, dont voici les principales, avec les commits associés :

- **Pagination sur les offres**  
  Ajout d'un système de pagination sur la page des offres pour une meilleure expérience utilisateur.  
  _Commit :_ `f9903ef` (Pagination sur la page NosOffres), `6489142` (Création dun système de pagination)

- **Modernisation de l'UI et gestion des logos**  
  Amélioration de l'affichage des logos d'organisation, fallback automatique, et refonte graphique.  
  _Commits :_ `b5fa9ab` (maj finale logos), `2c726f1` (maj logo2), `4029125` (correction pb connexion - logo)

- **Sécurité renforcée**  
  Correction de failles potentielles (vulnérabilités upload, validation des fichiers, etc.), gestion stricte des mots de passe (voir `Note_de_Clarification.txt`).  
  _Commit :_ `091c939` (maj finale vulnérabilité), `6104e1a`, `313253e` (shell.php)

- **Refonte des routes et séparation des responsabilités**  
  Refactoring pour séparer la logique métier dans les modèles et alléger les routes (contrôleurs), ajout de services utilitaires.  
  _Commits :_ `6ea25ea` (maj finale), `d29a726`, `43059cb` (corrections bugs et refactoring)

- **Gestion avancée des statuts et des demandes**  
  Ajout de la gestion des statuts (actif/inactif) pour les utilisateurs et organisations, workflow de validation des demandes (recruteur, organisation).  
  _Commits :_ `bc49bab` (maj OffreDeétail 1 et 2), `b4e1a9c` (maj finale filtre)

- **Tests unitaires et couverture**  
  Mise en place de tests Jest pour les modèles principaux, avec rapport de couverture généré dans `/coverage`.

Pour plus de détails, consulte l'historique Git (`git log --oneline`).

---

## Principes et bonnes pratiques suivis

- **Architecture MVC simplifiée**  
  - _Modèles_ dans `/model` : toute la logique d'accès à la base de données y est centralisée.
  - _Contrôleurs_ dans `/routes` : chaque fichier gère les routes d'un rôle ou d'une fonctionnalité (ex : `recruteur.js`, `admin.js`, `users.js`).
  - _Vues_ dans `/views` : pages dynamiques EJS, avec des partials pour factoriser le code.

- **Séparation stricte des responsabilités**  
  - Les routes ne contiennent que l'orchestration, la logique métier est dans les modèles ou les services.
  - Les services (`/services`) gèrent les fonctionnalités transverses (email, géocodage, calculs de distance).

- **Nommage cohérent et explicite**  
  - Les noms de fichiers, fonctions et variables sont en français, explicites et respectent la casse camelCase ou snake_case selon le contexte.
  - Les routes REST respectent la logique ressource/action.

- **Sécurité**  
  - Validation stricte des entrées utilisateurs (notamment pour les mots de passe et les fichiers uploadés).
  - Utilisation de bcrypt pour le hash des mots de passe.
  - Vérification du contenu des fichiers uploadés pour éviter l'exécution de code malicieux.
  - Gestion des sessions sécurisée.

- **Expérience utilisateur**  
  - Pagination, filtres dynamiques, feedback utilisateur (modales, messages de succès/erreur).
  - UI responsive et moderne (Bootstrap Icons, CSS custom).

- **Tests et qualité**  
  - Tests unitaires Jest pour les modèles.
  - Rapport de couverture dans `/coverage`.
  - Utilisation de conventions de commit claires pour tracer les évolutions.

---

## Installation et lancement

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-repo>
   cd projet-sr10
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer la base de données**
   - Créer une base MySQL et importer la structure + les exemples depuis `SQL insertion exemples.txt`.
   - Adapter la configuration de connexion dans `model/db.js` si besoin.

4. **Lancer l'application**
   ```bash
   npm run watch
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

5. **Lancer les tests**
   ```bash
   npm test
   ```

---

## Dépendances principales

- express, ejs, mysql, multer, bcrypt, nodemailer, archiver, uuid, mammoth, pdf-parse, xlsx, jest, dotenv

---

## Spécifications et règles métier

- **Mots de passe** :  
  - Minimum 12 caractères, au moins 2 majuscules, 2 minuscules, 2 chiffres, 2 caractères spéciaux (voir `Note_de_Clarification.txt`).
- **Champs JSON** :  
  - `siege_social` (Organisation) et `lieu_mission` (Fiche_Poste) sont stockés au format JSON (voir exemples dans `Note_de_Clarification.txt`).
- **Gestion des statuts** :  
  - Utilisateurs et organisations peuvent être actifs ou inactifs, avec workflow d'activation/validation par les administrateurs.

---

## Auteurs

- Projet réalisé par Mathéo GROS et Mathieu PIEKARZ.

---

**N'hésitez pas à consulter chaque dossier pour plus de détails sur l'implémentation !**

---
