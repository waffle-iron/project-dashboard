'use strict';
var bunyan = require('bunyan');

var logger = bunyan.createLogger({
  name: "Project Dashboard",
  streams: [{
    stream: process.stderr,
    level: "error",
    name: "error"
  }, {
    stream: process.stdout,
    // valid are 'info', 'warn', 'error'. Error always goes to stderr in Unix.
    level: process.env.LOGGING_LEVEL || 'warn',
    name: "console"
  }]
});

module.exports = logger;
