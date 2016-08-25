var pg      = require('pg'),
    fs      = require('fs'),
    merge   = require('merge'),
    _       = require('underscore');

pg.defaults.ssl = true;

pg.connect(process.env.DATABASE_URL, function(err, dbClient) {
  if (err) throw err;
  console.log('Connected to postgres!');

  dbClient.query(`
    DROP TABLE IF EXISTS projects;
    CREATE TABLE projects (
      id            SERIAL PRIMARY KEY,
      -- phase_id      SMALLINT,
      -- priority_id   SMALLINT,
      -- health_id     SMALLINT,
      phase         VARCHAR(32),
      priority      VARCHAR(32),
      health        VARCHAR(32),
      name          VARCHAR(128),
      agency        VARCHAR(128),
      department    VARCHAR(128),
      theme         VARCHAR(128),
      description   TEXT,
      service_url   VARCHAR(256),
      location      VARCHAR(64)
    );
    
    DROP TABLE IF EXISTS phases;
    CREATE TABLE phases (
      id SERIAL PRIMARY KEY,
      name VARCHAR(32)
    );
  `);
  insertProject(dbClient, "ProjectName", "ProjectAgency");
  migrateJSON(dbClient, "/../lib/projects/");

  dbClient
    .query('SELECT * FROM projects;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});

function insertProject(dbClient, project){
  dbClient.query(`
    INSERT INTO projects(name, agency) VALUES('` + project.name + `', '` + project.agency+`');
  `);
}

// Read each JSON project file and insert it into the database
function migrateJSON(dbClient, path){
  var files = fs.readdirSync(__dirname + path);
  var defaults = JSON.parse(fs.readFileSync(__dirname + path + 'defaults.json').toString());
  _.each(files,function(el)
  {
    var file = fs.readFileSync(__dirname + path + el).toString();
    try {
      var project = merge(true,defaults,JSON.parse(file));
      insertProject(dbClient, project);
    } catch(err) {
      console.log(err);
    }
  });
}
