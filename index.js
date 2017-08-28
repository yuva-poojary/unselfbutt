const Eris = require('eris')
const fs = require('fs')
const os = require('os')
const moment = require('moment')
const mkdirp = require('mkdirp')
const google = require('google')
const request = require('request')
const express = require('express')
const app = express()
// const Discogs = require('discogs-client')
const packageJSON = require('./package.json')

// Load Config
var config = require('./config.json')

var bot = new Eris(config.token)
var ownerID = config.ownerID
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
  if (msg.content === prefix + 'ping') {
    bot.createMessage(msg.channel.id, {
      embed: {
        title: 'Hey!',
        description: "I'm alive, don't worry!",
        author: {
          name: bot.user.username,
          icon_url: bot.user.avatarURL
        },
        color: 0x008000,
        footer: {
          text: config.name + ' ' + packageJSON.version
        }
      }
    })
  } else if (msg.content.startsWith(prefix + 'google')) {
    var searchCommand = prefix + 'google'
    if (msg.content.length <= searchCommand.length + 1) {
      bot.createMessage(msg.channel.id, 'Please specify a search term.')
      return
    }
    var filename = msg.content.substring(searchCommand.length + 1)
    google.resultsPerPage = 25
    var nextCounter = 0
    google(filename, function (err, res) {
      if (err) throw err
      bot.createMessage(msg.channel.id, 'Here are the top 4 results!')
      for (var i = 0; i < res.links.length; ++i) {
        var link = res.links[i]
        bot.createMessage(msg.channel.id, {
          embed: {
            title: link.title + ' - ' + link.href,
            description: link.description + '\n',
            author: {
              name: 'Google Search',
              icon_url: 'https://s-media-cache-ak0.pinimg.com/736x/66/00/18/6600188f65aa2e4cc2cd29017cb27662.jpg'
            },
            color: 0x008000,
            footer: {
              text: config.name + ' ' + packageJSON.version
            }
          }
        })
        if (i === 3) {
          return
        }
      }
      if (nextCounter < 4) {
        nextCounter += 1
        if (res.next) res.next()
      }
    })
  } else if (msg.content === prefix + 'searchSong') {
    fs.readFile(location, 'utf8', function (err, data) {
      if (err) throw err
    })
  } else if (msg.content === prefix + 'about') {
    bot.createMessage(msg.channel.id, {
      embed: {
        title: 'Hey!',
        description: "I'm a simple bot made by Noculi! You can find more infomation about me over at http://www.xn--5o8hui.cf/unselfbutt/",
        author: {
          name: bot.user.username,
          icon_url: bot.user.avatarURL
        },
        color: 0x008000,
        footer: {
          text: config.name + ' ' + packageJSON.version
        }
      }
    })
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

function logItPls (whathappened) {
  bot.createMessage(config.logChannel, {
    embed: {
      title: 'Hey! Look a log!',
      description: whathappened,
      color: 0x008000,
      footer: {
        text: config.name + ' ' + packageJSON.version
      }
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
    if (err) throw err
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
