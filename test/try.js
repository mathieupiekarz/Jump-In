/*var mdp = "ttAA11izg%%oaajivza";

const regex =
  /^(?=(?:.*[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÙ]){2,})(?=(?:.*[a-zàâäçéèêëîïôöûüùÿ]){2,})(?=(?:.*\d){2,})(?=(?:.*[!?@\$%&\*\+=\-_.,;:\/\\\|\^~#\(\)\[\]\{\}<>`'"€£µ§°¤]){2,})[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÙa-zàâäçéèêëîïôöûüùÿ!?@\$%&\*\+=\-_.,;:\/\\|^~#()\[\]{}<>'"`€£µ§°¤]{12,}$/;
if (!regex.test(mdp)) console.log("erreur");
else console.log("valide");
*/

/*
var mdp = "ttAA11##izgoaajivza";

const regex =
  /^(?=(?:.*[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÙ]){2,})(?=(?:.*[a-zàâäçéèêëîïôöûüùÿ]){2,})(?=(?:.*\d){2,})(?=(?:.*[!?@\$%&\*\+=\-_.,;:\/\\|^~#()[\]{}<>'"`€£µ§°¤]){2,})[A-ZÀÂÄÇÉÈÊËÎÏÔÖÛÜÙa-zàâäçéèêëîïôöûüùÿ\d!?@\$%&\*\+=\-_.,;:\/\\|^~#()[\]{}<>'"`€£µ§°¤]{12,}$/;

if (!regex.test(mdp)) console.log("erreur");
else console.log("valide");

var dico = { email: "benoit.demiscault@outlook.fr" };
console.log(dico.email);
*/

/*
var siren = "732829320";

let sum = 0;
for (let i = 0; i < 9; i++) {
  let digit = parseInt(siren[8 - i], 10);
  if (i % 2 === 0) digit *= 2;
  if (digit > 9) digit -= 9;
  sum += digit;
}
if (sum % 10 !== 0) console.log("ERREUR");
else console.log("valide");
*/

/* 

732829320 --> APPLE
552100554 --> MICROSOFT
407751858 --> RICARD 
343134763 --> JBL

941615692
216751073
585403074
407751858
251385035
116809831
668923873
687994368
922430715
216537720
681617908
400708418
977254481
352912257
381466515
978794261
059121483
482091444
810023739
390989580


*/
/*
const siren = "407751858";

if (!/^\d{9}$/.test(siren)) console.log("ERREUR");

let sum = 0;
for (let i = 0; i < 9; i++) {
  let digit = parseInt(siren[i], 10);
  if (i % 2 === 1) digit *= 2;
  if (digit > 9) digit -= 9;
  sum += digit;
}
if (sum % 10 !== 0) console.log("ERREUR");
else console.log("valide");
*/
/*
regex = /^[^@\s]+@([^@.\s]+\.)+[^@.\s]+$/;
const email = "test@gmail.com";
const email1 = "test.pi@gmail.com";
const email2 = "@gmail.com";

console.log(regex.test(email));
console.log(regex.test(email1));
console.log(regex.test(email2));
*/

const tab = [
  "LM Atos_2025-06-15T18_36_56_206Z.pdf",
  "LM WPP Media_2025-06-15T18_36_56_204Z.pdf",
];

tab.forEach((t, index) => {
  console.log(tab[index]);
  console.log(t);
  console.log("------------");
});
