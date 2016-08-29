var express     = require('express'),
    router      = express.Router(),
    fs          = require('fs'),
    controllers = require('./controllers'),
    basicAuth   = require('basic-auth'),
    _           = require('underscore');

try {
  var userFile = fs.readFileSync(__dirname + '/login-password.json').toString();
  var storedUser = JSON.parse(userFile);
} catch(err) {
  console.log(err);
}

// Authorize all routes
router.use(function (req, res, next) {	
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };
  var user = basicAuth(req);
  if (user && user.name && user.pass && 
    user.name === storedUser.login && 
    user.pass === storedUser.password) {
    return next(); 
  } 
  return unauthorized(res);
});

var priority_descriptions = {
  "Low": "Non-urgent services and those that have short-term benefit."
};

var priority_order = [
  'Top',
  'High',
  'Medium',
  'Low'
];

var health_order = [
  'Good',
  'Fair',
  'Critical'
];

var controller = new controllers(router);
controller.setupIndexPageRoute('location', ['/', '/location']);
controller.setupIndexPageRoute('agency', '/agency');
controller.setupIndexPageRoute('theme', '/theme');
controller.setupIndexPageRoute('health', '/health', health_order);
controller.setupIndexPageRoute('priority', '/priority', priority_order);

router.get('/projects/:id/:slug', controller.handleProjectIdSlug);
router.get('/projects/:id/:slug/prototype', controller.handleSlugPrototype);
router.get('/api', controller.handleApi);
router.get('/api/:id', controller.handleApiProjectId);

module.exports = router;
