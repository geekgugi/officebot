'use strict';


var path = require('path');
var request = require('request');
var Async = require('async');
var ProgressBar = require('progress');
var sqlite3 = require('sqlite3').verbose();

var outputFile = process.argv[2] || path.resolve(__dirname, 'mckbot.db');
var db = new sqlite3.Database(outputFile);


// Prepares the database connection in serialized mode
db.serialize();
db.run('CREATE TABLE IF NOT EXISTS base (id INTEGER PRIMARY KEY, question TEXT, answer TEXT)');
db.run('INSERT INTO base (question, answer) VALUES ("I am on PTO Today", "Do you want timesheet to be filled ?")');
db.close();
console.log('Database is created !');
