var express   = require('express'),
    router    = express.Router(),
    fs        = require('fs'),
    basicAuth = require('basic-auth'),
    _         = require('underscore');

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

  // A way to force the ordering of the directorates.
  var directorate_order = [
  'Border Force',
  'Immigration Enforcement',
  'UKVI',
  "Her Majesty's Passport Office",
  'Cross Home Office'
  ];

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

  var priority_descriptions = {
    "Low":"Non-urgent services and those that have short-term benefit."
  };

  // A way to force the ordering of the phases.
  var phase_order = ['pipeline', 'discovery','alpha','beta','live'];

  /*
  A function to gather the data by
  'phase' and then 'facing' so the
  index.html can spit them out.
  */
  function indexify(data)
  {
    var new_data = {};
    _.each(data, function(value, key, list)
    {
      var item = _.groupBy(value,'phase');
      new_data[key] = {};
      _.each(item, function(v,k,l)
      {
        var piece = _.groupBy(v,'facing');
        new_data[key][k] = piece;
      });
    });
    return new_data;
  }

  // If phaseName was provided, trim projects that don't belong to that phase 
  // Otherwise return unmodified data
  function filterPhaseIfPresent(data, phaseName){
    if(typeof phaseName !== "undefined" && phaseName !== "all") {
      data = _.where(data, {"phase": phaseName})
    }
    return data;
  }

  /*
  - - - - - - - - - -  DIRECTORATE INDEX PAGE - - - - - - - - - -
  */
  router.get('/directorate', function (req, res)
  {
    var data = filterPhaseIfPresent(req.app.locals.data, req.query.phase);
    data = _.groupBy(data, 'directorate');
    var new_data = indexify(data);
    var phases = _.countBy(req.app.locals.data, 'phase');
    res.render('index', {
      "data":new_data,
      "counts":phases,
      "view":"directorate",
      "row_order":directorate_order,
      "phase_order":phase_order
    }
    );
  });

  /*
  - - - - - - - - - -  LOCATION INDEX PAGE - - - - - - - - - -
  */
  router.get(['/','/location'], function (req, res)
  {
    var data = filterPhaseIfPresent(req.app.locals.data, req.query.phase);
    data = _.groupBy(data, 'location');
    var new_data = indexify(data);

    var loc_order = [];
    _.each(data, function(value, key, list)
    {
      loc_order.push(key);
    });
    loc_order.sort();

    var phases = _.countBy(req.app.locals.data, 'phase');
    res.render('index', {
      "data":new_data,
      "phase": req.query.phase,
      "counts":phases,
      "view":"location",
      "row_order":loc_order,
      "phase_order":phase_order
    });
  });



  /*
 - - - - - - - - - -  THEME INDEX PAGE - - - - - - - - - -
 */
 router.get('/theme/', function (req, res)
 {
  var data = filterPhaseIfPresent(req.app.locals.data, req.query.phase);
  data = _.groupBy(data, 'theme');
  var new_data = indexify(data);

  var theme_order = [];
  _.each(data, function(value, key, list)
  {
    theme_order.push(key);
  });
  theme_order.sort();

  var phases = _.countBy(req.app.locals.data, 'phase');
  res.render('index', {
    "data":new_data,
    "counts":phases,
    "view":"theme",
    "row_order":theme_order,
    "phase_order":phase_order
  });
});


  /*
  - - - - - - - - - - HEALTH INDEX PAGE - - - - - - - - - -
  */
  router.get('/health/', function (req, res)
  {
    var data = filterPhaseIfPresent(req.app.locals.data, req.query.phase);
    data = _.groupBy(data, 'health');
    var new_data = indexify(data);
    var phases = _.countBy(req.app.locals.data, 'phase');

    res.render('index', {
      "data":new_data,
      "counts":phases,
      "view":"health",
      "row_order": health_order,
      "phase_order":phase_order
    }
    );
  });

  /*
  - - - - - - - - - - PRIORITY INDEX PAGE - - - - - - - - - -
  */
  router.get('/priority/', function (req, res)
  {
    var data = filterPhaseIfPresent(req.app.locals.data, req.query.phase);
    data = _.groupBy(data, 'priority');
    var new_data = indexify(data);
    var phases = _.countBy(req.app.locals.data, 'phase');

    res.render('index', {
      "data":new_data,
      "counts":phases,
      "view":"priority",
      "row_order":priority_order,
      "phase_order":phase_order,
      "priority_descriptions":priority_descriptions
    }
    );
  });

  /*
  - - - - - - - - - -  PROJECT PAGE - - - - - - - - - -
  */
  router.get('/projects/:id/:slug', function (req, res)
  {
    var data = _.findWhere(req.app.locals.data, {id:parseInt(req.params.id)});
    res.render('project', {
      "data":data,
      "phase_order":phase_order,
    });
  });

  /*
  - - - - - - - - - -  PROTOTYPE REDRIECT - - - - - - - - - -
  */
  router.get('/projects/:id/:slug/prototype', function (req, res)
  {
    var id = req.params.id;
    var data = _.findWhere(req.app.locals.data, {id:parseInt(id)});
    if (typeof data.prototype == 'undefined')
    {
      res.render('no-prototype',{
        "data":data,
      });
    } else {
      res.redirect(data.prototype);
    }
  });

  /*
  - - - - - - - - - -  ALL THE DATA AS JSON - - - - - - - - - -
  */

  router.get('/api', function (req, res) {
    console.log(req.app.locals.data);
    res.json(req.app.locals.data);
  });

  router.get('/api/:id', function (req, res) {
    var data = _.findWhere(req.app.locals.data, {id: (parseInt(req.params.id))});
    if (data) {
      res.json(data);
    } else {
      res.json({error: 'ID not found'});
    }
  });

  module.exports = router;
