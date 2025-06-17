const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Templates d'emails
const emailTemplates = {
  compteCree: (nom, prenom) => ({
    subject: "Bienvenue sur Jump'In !",
    html: `
      <h1>Bienvenue ${prenom} ${nom} !</h1>
      <p>Votre compte a été créé avec succès sur Jump'In.</p>
      <p>Vous pouvez dès maintenant vous connecter et commencer à utiliser nos services.</p>
      <p>Cordialement,<br>L'équipe de Jump'In</p>
    `
  }),

  demandeOrganisationValidee: (nom, prenom, nomOrganisation) => ({
    subject: 'Votre demande d\'organisation a été validée',
    html: `
      <h1>Félicitations ${prenom} ${nom} !</h1>
      <p>Votre demande pour rejoindre l'organisation "${nomOrganisation}" a été validée.</p>
      <p>Vous pouvez dès maintenant vous connecter en tant que recruteur.</p>
      <p>Cordialement,<br>L'équipe de Jump'In</p>
    `
  }),

  droitsAdminOctroyes: (nom, prenom) => ({
    subject: 'Vous êtes maintenant administrateur',
    html: `
      <h1>Félicitations ${prenom} ${nom} !</h1>
      <p>Les droits d'administration vous ont été octroyés.</p>
      <p>Vous pouvez dès maintenant accéder au panneau d'administration.</p>
      <p>Cordialement,<br>L'équipe de Jump'In</p>
    `
  })
};

// Fonction d'envoi d'email
const sendEmail = async (to, template, data) => {
  try {
    const mailOptions = {
      from: `"Plateforme de Recrutement" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  emailTemplates
}; 