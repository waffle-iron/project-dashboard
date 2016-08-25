var mongoose  = require('mongoose'),
    _         = require('underscore');
    merge     = require('merge'),
    fs        = require('fs');

mongoose.connect(process.env.MONGODB_URI);

var phaseSchema = mongoose.Schema([{
    "label": String,
    "date": String
}]);

var teamMemberSchema = mongoose.Schema({
  "name": String,
  "role": String,
  "primaryLocation": String,
  "secondaryLocation": String,
  "email": String,
  "mobile": String,
  "skype": String,
  "slack": String
});

var Project = mongoose.model('Project', { 
  "name": String,
  "department": String,
  "agency": String,
  "priority": String, 
  "theme": String,
  "health": String,
  "description": String,
  "location": String,
  "phase": String,
  "phase-history": {
    "pipeline": phaseSchema,
    "discovery": phaseSchema,
    "alpha": phaseSchema,
    "beta": phaseSchema,
    "live": phaseSchema
  },
  "resources": [{
    "name": String,
    "url": String
  }],
  "ourTeam": [teamMemberSchema],
  "clientTeam": [teamMemberSchema]
});

// Save a single project to the database
function insertProject(dbClient, project) {
  var newProject = new Project(project);
  newProject.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Project "%s" has been saved.', project.name);
    }
  });
}

// Read each JSON project file and insert it into the database
function migrateJSON(dbClient, path) {
  var files = fs.readdirSync(__dirname + path);
  var defaults = JSON.parse(fs.readFileSync(__dirname + path + 'defaults.json').toString());
  _.each(files,function(el) {
    var file = fs.readFileSync(__dirname + path + el).toString();
    try {
      var project = merge(true,defaults,JSON.parse(file));
      insertProject(dbClient, project);
    } catch(err) {
      console.log(err);
    }
  });
}

migrateJSON(mongoose, '/../lib/projects/');
