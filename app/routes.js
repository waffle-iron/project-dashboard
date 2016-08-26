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
  function indexify(data) {
    var new_data = {};
    _.each(data, function(value, key, list) {
      var item = _.groupBy(value,'phase');
      new_data[key] = {};
      _.each(item, function(v,k,l) {
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

  /**
   * If no rowOrder was specified, prepare an alphabetical one
   * else return the exact same rowOrder as given in the parameter
   * useful when you want to force a specific order instead of an alphabetical one
   * ex: ['Top', 'High', 'Medium'] to make the 'Top' priority section appear first
   * @param  {String[]} [rowOrder] list that forces the order of values by which the projects are grouped
   * @param  {Object[]} projects data
   * @return {String[]} list showing the order of values by which the projects are grouped
   */
  function prepareRowOrderIfNotPresent(rowOrder, data){
    if(rowOrder === undefined) {
      rowOrder = [];
      _.each(data, function(value, key, list) {
        rowOrder.push(key);
      });
      rowOrder.sort();
    }
    return rowOrder;
  }

  /**
   * @param  {String} groupBy Name of the field by which the projects will be grouped
   * @param  {String} path Router path, ex: '/location'
   * @param  {String[]} [rowOrder] Order of values by which to group the projects, default: alphabetical
   */
  function setupIndexPageRoute(groupBy, path, rowOrder){
    router.get(path, function (req, res) {
      var data = filterPhaseIfPresent(req.app.locals.data, req.query.phase);
      data = _.groupBy(data, groupBy);
      var new_data = indexify(data);
      var phases = _.countBy(req.app.locals.data, 'phase');
      rowOrder = prepareRowOrderIfNotPresent(rowOrder, data);

      res.render('index', {
        "data":new_data,
        "phase": req.query.phase,
        "counts":phases,
        "view":groupBy,
        "row_order":rowOrder,
        "phase_order":phase_order
      }
      );
    });
  }

  setupIndexPageRoute('location', ['/', '/location']);
  setupIndexPageRoute('agency', '/agency');
  setupIndexPageRoute('theme', '/theme');
  setupIndexPageRoute('health', '/health', health_order);
  setupIndexPageRoute('priority', '/priority', priority_order);

  /*
  - - - - - - - - - -  PROJECT PAGE - - - - - - - - - -
  */
  router.get('/projects/:id/:slug', function (req, res) {
    var data = _.findWhere(req.app.locals.data, {id:parseInt(req.params.id)});
    res.render('project', {
      "data":data,
      "phase_order":phase_order,
    });
  });

  /*
  - - - - - - - - - -  PROTOTYPE REDRIECT - - - - - - - - - -
  */
  router.get('/projects/:id/:slug/prototype', function (req, res) {
    var id = req.params.id;
    var data = _.findWhere(req.app.locals.data, {id:parseInt(id)});
    if (typeof data.prototype == 'undefined') {
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
