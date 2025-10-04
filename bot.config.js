const TelegramBot = require('node-telegram-bot-api')
const {token, proxy} = require("./basic-data");
const {HttpsProxyAgent} = require("https-proxy-agent");


const agent = new HttpsProxyAgent(proxy)

const bot = new TelegramBot(token, {
  polling: {
    interval: 1000,      // 拉取间隔
    autoStart: true,     // 启动时立即开始
    params: {
      timeout: 10        // 长轮询超时
    }
  },
  request: {
    agent: agent
  }
})

module.exports = bot