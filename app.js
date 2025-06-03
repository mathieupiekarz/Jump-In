var createError = require("http-errors");
const express = require("express");
var session = require("./session");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var recruteurRouter = require("./routes/recruteur");
var adminRouter = require("./routes/admin");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(session.init()); //Initialiser les sessions

// check user before app.use (path, router)
app.all("*", function (req, res, next) {
  const nonSecurePaths = ["/users/login", "/users/inscription"];
  
  // Autoriser l'accès aux chemins non sécurisés
  if (nonSecurePaths.includes(req.path)) {
    return next();
  }

  // Vérifier l'accès selon le rôle et le chemin
  if (session.hasAccess(req.session, req.path)) {
    return next();
  }

  // Rediriger vers la page de connexion si non autorisé
  res.redirect("/users/login");
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/recruteur", recruteurRouter);
app.use("/:entreprise_id", recruteurRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
