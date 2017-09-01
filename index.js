const Eris = require('eris')
const fs = require('fs')
const os = require('os')
const moment = require('moment')
const mkdirp = require('mkdirp')
const google = require('google')
const request = require('request')
const express = require('express')
const app = express()
const pathModule = require('path')
// const Discogs = require('discogs-client')
const packageJSON = require('./package.json')

// Spoopy
var commands = []

function LoadModules (path) {
  fs.lstat(path, function (err, stat) {
    if (err) {
      return webLogger(err)
    }
    if (stat.isDirectory()) {
      // we have a directory: do a tree walk
      fs.readdir(path, function (err, files) {
        if (err) {
          return webLogger(err)
        }
        var f = files.length
        var l = files.length
        for (var i = 0; i < l; i++) {
          f = pathModule.join(path, files[i])
          var arrayPls = f.replace('.js', '')
          var arrayPls1 = arrayPls.replace(pathModule.join(__dirname, 'commands'), '')
          var arrayPls2 = arrayPls1.replace(/\\/g, '')
          var arrayPls3 = arrayPls2.replace('/', '')
          commands.push(' ' + arrayPls3)
          LoadModules(f)
        }
      })
    } else {
      // we have a file: load it
      require(path)(moduleHolder)
    }
  })
}

var DIR = pathModule.join(__dirname, 'commands')
LoadModules(DIR)
var moduleHolder = {}
exports.moduleHolder = moduleHolder

// Load Config
var config = require('./config.json')

var bot = new Eris(config.token)
var prefix = config.prefix
var location = config.snipLocation

function checkForUpdate () {
  var options = {
    url: 'https://raw.githubusercontent.com/Noculi/unselfbutt/master/package.json',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
      'User-Agent': 'unselfbutt-noculi/' + packageJSON.version
    }
  }
  request(options, function (err, res, body) {
    if (err) throw err
    let json = JSON.parse(body)
    if (packageJSON.version === json.version) {
      webLogger('UnSelfButt is up to date!')
      webLogger('Ready!')
    } else {
      webLogger('There is a new update for UnSelfButt!')
      webLogger('Ready! (But you should update)')
    }
  })
}

bot.on('messageCreate', (msg) => {
    if (msg.content.startsWith(prefix)) {
      if (msg.content === prefix + 'help') {
        bot.createMessage(msg.channel.id, "Hey I'm " + config.name + ' ' + packageJSON.version)
        bot.createMessage(msg.channel.id, 'Here are all the commands that can be used')
        bot.createMessage(msg.channel.id, '`' + commands + '`')
        bot.createMessage(msg.channel.id, 'You can use these commands by doing `' + prefix + '<command> <args>`')
      } else {
        var watCom = prefix
        if (msg.content.length === watCom.length) {
          return
        }
        var commandFound = msg.content.substring(watCom.length)
        var actualCommand = commandFound.split(' ')
        var preArgCommand = prefix + actualCommand[0]
        var args = msg.content.substring(preArgCommand.length + 1)
        try {
          moduleHolder[actualCommand[0]](bot, msg, args)
        } catch (err) {
          webLogger(err)
        }
      }
    }
})

bot.on('messageCreate', (msg) => {
  if (config.chatLogging === 'Y') {
    var time = '[' + moment().format('MMMM Do YYYY, h:mm:ss a')
    var finalMessage = time + ']' + ' [' + msg.author.username + '#' + msg.author.discriminator + '] ' + msg.content + os.EOL
    var finalPath = './logs/groups/' + msg.channel.id + '.txt'
    if (!msg.channel.guild) {
      mkdirp('./logs/groups/', function (err) {
        if (err) throw err
        fs.appendFile(finalPath, finalMessage, function (err) {
          if (err) throw err
        })
      })
    } else {
      mkdirp('./logs/' + '/' + msg.channel.guild.name + '/', function (err) {
        if (err) throw err
        fs.appendFile(finalPath, finalMessage, function (err) {
          if (err) throw err
        })
      })
    }
  }
})

function writeLogsTxt (data) {
  fs.writeFile('./logs.txt', data, function (err) {
    if (err) {
      return webLogger(err)
    }
  })
}

function startNet () {
  var spawn = require('child_process').spawn
  var child = spawn('node', ['index.js'], {
    detached: true,
    stdio: [ 'ignore', 'ignore', 'ignore' ]
  })
  child.unref()
}

function webLogger (data) {
  var time = '[' + moment().format('MMMM Do YYYY, h:mm:ss a')
  var finalMessage = time + '] ' + data + os.EOL
  fs.appendFile('./logs.txt', finalMessage, function (err) {
    if (err) {
      return webLogger(err)
    }
  })
}


app.use(express.static('public'))

app.get('/apiV1/shutdown', function (req, res) {
  webLogger('Shutting down UnSelfButt.')
  res.send('<h1>Server has caught fire</h1><br /><i>Same thing as shutting down right?</i><br /><img src="https://i.imgur.com/daF13vl.gif" />')
  process.exit(0)
})

app.get('/apiV1/reboot', function (req, res) {
  res.send('Rebooting. <a href="http://localhost:' + config.port + '/">Click here to go back to the dashboard</a>')
  startNet()
  process.exit(0)
})

app.get('/apiV1/configChange', function (req, res) {
  webLogger('Changing SelfButt config.')
})

app.get('/apiV1/config', function (req, res) {
  fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) throw err
    res.send(data)
  })
})

app.get('/apiV1/commands', function (req, res) {
  res.send(commands)
})


app.get('/apiV1/logs', function (req, res) {
  fs.readFile('./logs.txt', 'utf8', function (err, data) {
    if (err) throw err
    res.send(data)
  })
})

app.get('/apiV1/info', function (req, res) {
  var finalRes = '{' + '"name":"' + config.name + '",' + '"version":"' + packageJSON.version + '",' + '"totalGuilds":"' + bot.guilds.size + '",' + '"totalChannels":"' + Object.keys(bot.channelGuildMap).length + '",' + '"onlineUsers":"' + bot.users.size + '"}'
  res.send(finalRes)
})

app.listen(config.port, function () {
  webLogger('You can manage your bot over at "http://localhost:' + config.port + '"')
})

process.title = 'UnSelfButt'
writeLogsTxt('')
checkForUpdate()

bot.connect()
