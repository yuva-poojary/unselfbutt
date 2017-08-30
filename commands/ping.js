const packageJSON = require('../package.json')
var config = require('../config.json')

function handler (bot, msg, args) {
  bot.createMessage(msg.channel.id, {
    embed: {
      title: 'Hey!',
      description: "I'm alive, don't worry!",
      author: {
        name: msg.author.username,
        icon_url: msg.author.avatarURL
      },
      color: 0x008000,
      footer: {
        text: config.name + ' ' + packageJSON.version
      }
    }
  })
}

module.exports = function (moduleHolder) {
  moduleHolder['ping'] = handler
}
