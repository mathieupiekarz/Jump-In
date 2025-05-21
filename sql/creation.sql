CREATE TABLE Administrateur(
id_admin int AUTO_INCREMENT PRIMARY KEY,
email varchar(255) NOT NULL UNIQUE,
mdp varchar(255) NOT NULL,
nom varchar(100) NOT NULL,
prenom varchar(100) NOT NULL,
numero_telephone varchar(15) NOT NULL,
date_creation date DEFAULT CURRENT_DATE,
statut enum('actif', 'inactif') NOT NULL 
); 

CREATE TABLE Organisation(
siren varchar(9) PRIMARY KEY,
nom varchar(255) NOT NULL,
type enum('association', 'EURL', 'SA', 'SAS', 'SASU', 'ONG', 'SARL', 'SNC', 'SCS', 'SCA', 'SCI', 'SCP', 'SCM', 'SCEA', 'SCCV', 'SCPa', 'EARL', 'GAEC', 'SCIC', 'SCOP', 'GIE', 'GEIE', 'GE') NOT NULL, 
siege_social json NOT NULL,
statut enum('inactive', 'en_cours', 'active') NOT NULL
);

CREATE TABLE Candidat(
id_can int AUTO_INCREMENT PRIMARY KEY,
email varchar(255) NOT NULL UNIQUE,
mdp varchar(255) NOT NULL,
nom varchar(100) NOT NULL,
prenom varchar(100) NOT NULL,
numero_telephone varchar(15) NOT NULL,
date_creation date DEFAULT CURRENT_DATE,
statut enum('actif', 'inactif') NOT NULL 
);

CREATE TABLE Piece_Jointe_Durable(
chemin varchar(255) PRIMARY KEY,
nom varchar(100) NOT NULL,
type enum('pdf', 'jpeg', 'png', 'xlsx', 'docx') NOT NULL,
id_can int, 
FOREIGN KEY (id_can) REFERENCES Candidat(id_can) ON DELETE CASCADE
);

CREATE TABLE DemandeRecruteur(
id_can int,
siren varchar(9),
descriptionDR text NOT NULL,
dateDemandeDR date NOT NULL,
statutDR enum('validee', 'refusee', 'en_attente') NOT NULL,
PRIMARY KEY(id_can, siren),
FOREIGN KEY(id_can) REFERENCES Candidat(id_can) ON DELETE CASCADE,
FOREIGN KEY(siren) REFERENCES Organisation(siren) ON DELETE CASCADE
);

CREATE TABLE DemandeCreationOrganisation(
id_can int,
siren varchar(9),
descriptionCrO text NOT NULL,
dateDemandeCrO date NOT NULL,
statutCrO enum('validee', 'refusee', 'en_attente') NOT NULL,
PRIMARY KEY(id_can, siren),
FOREIGN KEY(id_can) REFERENCES Candidat(id_can) ON DELETE CASCADE
);

CREATE TABLE Fiche_Poste(
id_fiche int AUTO_INCREMENT PRIMARY KEY,
intitule varchar(255) NOT NULL,
statut_de_poste varchar(100) NOT NULL,
responsable_hierarchique varchar(100) NOT NULL,
type_metier varchar(255) NOT NULL,
lieu_mission json NOT NULL,
rythme varchar(255) NOT NULL,
fourchette_salaire varchar(255) NOT NULL,
description text NOT NULL,
siren varchar(9),
FOREIGN KEY (siren) REFERENCES Organisation(siren) ON DELETE CASCADE
); 

CREATE TABLE Offre_Emploi(
numero int AUTO_INCREMENT PRIMARY KEY,
etat enum('non_publiee', 'publiee', 'expiree') NOT NULL,
date_validite date NOT NULL,
indication text,
nb_pieces_demandees int NOT NULL,
id_fiche int,
FOREIGN KEY (id_fiche) REFERENCES Fiche_Poste(id_fiche) ON DELETE CASCADE
);

CREATE TABLE Candidature(
id_can int,
num_OE int, 
date_candidature date NOT NULL,
PRIMARY KEY (id_can, num_OE),
FOREIGN KEY (id_can) REFERENCES Candidat(id_can) ON DELETE CASCADE,
FOREIGN KEY (num_OE) REFERENCES Offre_Emploi(numero) ON DELETE CASCADE
);

CREATE TABLE Piece_Jointe_Temporaire(
chemin varchar(255) PRIMARY KEY,
nom varchar(100) NOT NULL,
type enum('pdf', 'jpeg', 'png', 'xlsx', 'docx') NOT NULL,
id_can int, 
num_OE int,
FOREIGN KEY (id_can) REFERENCES Candidature(id_can) ON DELETE CASCADE
FOREIGN KEY (num_OE) REFERENCES Offre_Emploi(num_OE) ON DELETE CASCADE
);

CREATE TABLE Recruteur(
id_rec int AUTO_INCREMENT PRIMARY KEY,
siren varchar(9),
email varchar(255) NOT NULL UNIQUE,
mdp varchar(255) NOT NULL,
nom varchar(100) NOT NULL,
prenom varchar(100) NOT NULL,
numero_telephone varchar(15) NOT NULL,
date_creation date DEFAULT CURRENT_DATE,
statut enum('actif', 'inactif') NOT NULL,
FOREIGN KEY (siren) REFERENCES Organisation(siren) ON DELETE CASCADE
); 

CREATE TABLE DemandeChangerOrganisation(
id_rec int,
siren varchar(9),
descriptionChO text NOT NULL,
dateDemandeChO date NOT NULL,
statutChO enum('validee', 'refusee', 'en_attente') NOT NULL,
PRIMARY KEY(id_rec, siren),
FOREIGN KEY (id_rec) REFERENCES Recruteur(id_rec) ON DELETE CASCADE,
FOREIGN KEY (siren) REFERENCES Organisation(siren) ON DELETE CASCADE
);
