const packageJSON = require('../package.json')
var config = require('../config.json')

function handler (bot, msg, args) {
  bot.createMessage(msg.channel.id, {
    embed: {
      title: 'Hey!',
      description: "I'm a simple bot made by Noculi! You can find more infomation about me over at https://noculi.github.io/unselfbutt/",
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

module.exports = function (moduleHolder) {
  moduleHolder['about'] = handler
}
