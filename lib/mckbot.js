'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "norrisbot")
 *      dbPath : the path to access the database (will default to "data/norrisbot.db")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */
 var IDIOT_MSG = "Sorry, I didn't catch that !";
var MckBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'mckbot';
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'mckbot.db');

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(MckBot, Bot);

/**
 * Run the bot
 * @public
 */
MckBot.prototype.run = function () {
    MckBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    //this.on('file_shared', this._askAboutVG);
    this.on('message', this._onMessage);
};


MckBot.prototype._askAboutVG = function () {
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
MckBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
    this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
MckBot.prototype._onMessage = function (message) {
  console.log(message.type);
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromMckBot(message)
    ) {
        this._replyAsAssist(message);
    }
};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
MckBot.prototype._replyAsAssist = function (originalMessage) {
    var self = this;
    self.db.get('SELECT id, answer from base WHERE question like "' + originalMessage.text +'"', function (err, record) {
      var channel = self._getChannelById(originalMessage.channel);
      if (err) {
        self.postMessageToChannel(channel.name, IDIOT_MSG, {as_user: true});
        return;
      }
      if (record === undefined) {

        self.postMessageToChannel(channel.name, IDIOT_MSG, {as_user: true});
        return;

      }
      self.postMessageToChannel(channel.name, record.answer, {as_user: true});
      console.log(record.answer);

    });
/*    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, "Hi I am massist, How can I help you ?", {as_user: true});
        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    }); */
};

/**
 * Loads the user object representing the bot
 * @private
 */
MckBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

/**
 * Open connection to the db
 * @private
 */
MckBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
MckBot.prototype._firstRunCheck = function () {
    var self = this;
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {
            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
};

/**
 * Sends a welcome message in the channel
 * @private
 */
MckBot.prototype._welcomeMessage = function () {
  var self = this;
  for (var channel of self.channels) {
    this.postMessageToChannel(channel.name, "His Guys, I am your office assitant", {as_user : true});
  }
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
MckBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
MckBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
MckBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
MckBot.prototype._isFromMckBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
MckBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = MckBot;
