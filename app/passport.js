'use strict';

/**
 * Configure passport for simple database authentication
 */
const passport = require('passport');
const bunyan = require('bunyan');
const config = require('./configAzureAD');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

var strategyConfig = {
  callbackURL: config.creds.returnURL,
  realm: config.creds.realm,
  clientID: config.creds.clientID,
  clientSecret: config.creds.clientSecret,
  oidcIssuer: config.creds.issuer,
  identityMetadata: config.creds.identityMetadata,
  scope: config.creds.scope,
  skipUserProfile: config.creds.skipUserProfile,
  responseType: config.creds.responseType,
  responseMode: config.creds.responseMode,
  validateIssuer: config.creds.validateIssuer,
  passReqToCallback: config.creds.passReqToCallback,
  loggingLevel: config.creds.loggingLevel
};

var log = bunyan.createLogger({
  name: 'Project Dashboard - passport.js',
  streams: [{
    stream: process.stderr,
    level: "error",
    name: "error"
  }, {
      stream: process.stdout,
      level: "warn",
      name: "console"
    }]
});

if (strategyConfig.loggingLevel) { log.levels("console", strategyConfig.loggingLevel); }

// array to hold logged in users
var users = [];

var findByEmail = function (email, fn) {
  log.info('Searching for a user by email: ' + email);
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.email === email) {
      log.info('User was found using his email: ' + email);
      return fn(user);
    }
  }
  return fn(null);
};


// Used by ADFS users
passport.use(new OIDCStrategy(strategyConfig,
  function (profile, done) {
    // Depending on the type of the account e.g. registered in live.com or kainos.com
    // user's email may be returned in "unique_name" field instead of "email"
    var email = profile._json.email || profile._json.unique_name
    if (!email) {
      log.error("No email found in the user's profile data returned by the identity provider");
      return done(new Error("No email found"), null);
    }

    process.nextTick(function () {
      findByEmail(email, function(user){
        if (!user) {
          log.info("Registering a new user using his email: " + email);
          users.push(profile);
          return done(null, profile);
        }
        log.info("Authenticating an existing user: " + email);
        return done(null, user);
      });
    });
  }
));

passport.serializeUser(function (user, done) {
  log.info("Serializing user: " + user.email);
  done(null, user.email);
});

passport.deserializeUser(function (id, done) {
  log.info("Deserializing user: " + id);
  findByEmail(id, function (user) {
    done(null, user);
  });
});
