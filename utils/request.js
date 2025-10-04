const axios = require('axios')
const {HttpsProxyAgent} = require("https-proxy-agent");
const {proxy} = require("../basic-data");

const agent = new HttpsProxyAgent(proxy)

const request = axios.create({
    httpAgent:agent,
    httpsAgent:agent,
    responseType:'arraybuffer'
})

module.exports = request



