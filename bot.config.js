import TelegramBot from 'node-telegram-bot-api';
import {HttpsProxyAgent} from "https-proxy-agent";
import {telegram} from "./config.js";


const agent = new HttpsProxyAgent(telegram.proxy);

const bot = new TelegramBot(telegram.token, {
  polling: telegram.polling.enabled,
  request: {
    proxy: telegram.proxy,
    httpsAgent: agent
  }
})

export default bot;