var _ = require('underscore');
var connect = require('connect-ensure-login');

function Controller(router){
  if (!(this instanceof Controller)) {
    return new Controller(router);
  }
  this.router = router;
}

// A way to force the ordering of the phases.
var phase_order = ['pipeline', 'discovery','alpha','beta','live'];

// JSON data of a project
Controller.prototype.handleApiProjectId = function (req, res) {
  var data = _.findWhere(req.app.locals.data, {id: (parseInt(req.params.id))});
  if (data) {
    res.json(data);
  } else {
    res.json({error: 'ID not found'});
  }
}

// All the data as JSON
Controller.prototype.handleApi = function (req, res) {
  res.json(req.app.locals.data);
}

// Project info
Controller.prototype.handleProjectIdSlug = function(req, res) {
  var data = _.findWhere(req.app.locals.data, {id:parseInt(req.params.id)});
  res.render('project', {
    "data":data,
    "phase_order":phase_order,
  });
}

// Prototype version of project info 
Controller.prototype.handleSlugPrototype = function(req, res) {
  var id = req.params.id;
  var data = _.findWhere(req.app.locals.data, {id:parseInt(id)});
  if (typeof data.prototype == 'undefined') {
    res.render('no-prototype',{
      "data":data,
    });
  } else {
    res.redirect(data.prototype);
  }
}

/**
 * @param  {String} groupBy Name of the field by which the projects will be grouped
 * @param  {String} path Router path, ex: '/location'
 * @param  {String[]} [rowOrder] Order of values by which to group the projects, default: alphabetical
 */
Controller.prototype.setupIndexPageRoute = function(groupBy, path, rowOrder) {
  this.router.get(path, connect.ensureLoggedIn(), function (req, res) {
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

/**
 * If no rowOrder was specified, prepare an alphabetical one
 * else return the exact same rowOrder as given in the parameter
 * useful when you want to force a specific order instead of an alphabetical one
 * ex: ['Top', 'High', 'Medium'] to make the 'Top' priority section appear first
 * @param  {String[]} [rowOrder] list that forces the order of values by which the projects are grouped
 * @param  {Object[]} projects data
 * @return {String[]} list showing the order of values by which the projects are grouped
 */
function prepareRowOrderIfNotPresent(rowOrder, data) {
  if(rowOrder === undefined) {
    rowOrder = [];
    _.each(data, function(value, key, list) {
      rowOrder.push(key);
    });
    rowOrder.sort();
  }
  return rowOrder;
}

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
function filterPhaseIfPresent(data, phaseName) {
  if(typeof phaseName !== "undefined" && phaseName !== "all") {
    data = _.where(data, {"phase": phaseName})
  }
  return data;
}

module.exports = Controller;
