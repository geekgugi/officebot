#!/usr/bin/env node

'use strict';

var MckBot = require('../lib/mckbot');

var token = process.env.BOT_API_KEY || require('../token');
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME || "massist";

var mckbot = new MckBot({
    token: token,
    dbPath: dbPath,
    name: name
});

mckbot.run();
