var express = require("express");
var router = express.Router();

var candidat = require("../model/candidat.js");
var admin = require("../model/administrateur.js");
var organisation = require("../model/organisation.js");

router.get("/userlist", function (req, res, next) {
  result = candidat.readall((result) => {
    res.render("userlist", { title: "liste des utilisateurs", users: result });
  });
});

router.get("/adminlist", function (req, res, next) {
  result = admin.readall(function (result) {
    res.render("adminlist", {
      title: "Liste des administrateurs",
      users: result,
    });
  });
});

router.get("/orgalist", function (req, res, next) {
  result = organisation.readall(function (result) {
    res.render("orgalist", {
      title: "Liste des organisations",
      orgs: result,
    });
  });
});

module.exports = router;
