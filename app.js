var createError = require("http-errors");
const express = require("express");
var session = require("./session");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

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
  console.log("Session actuelle :", req.session);
  const nonSecurePaths = ["/users/login", "/users/inscription"];
  const adminPaths = []; //list des urls admin
  if (nonSecurePaths.includes(req.path)) return next();
  //authenticate user
  if (adminPaths.includes(req.path)) {
    if (session.isConnected(req.session, "admin")) return next();
    else
      res.status(403).render("error", { message: " Unauthorized access", error: {} });
  } else {
    if (session.isConnected(req.session)) return next();
    // not authenticated
    else res.redirect("/users/login");
  }
});

app.use("/", indexRouter);
app.use("/users", usersRouter);

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
