import axios from 'axios';
import {HttpsProxyAgent} from "https-proxy-agent";
import {http} from "../config.js";

const agent = new HttpsProxyAgent(http.proxy)

const request = axios.create({
    httpAgent: agent,
    httpsAgent: agent,
    responseType: 'arraybuffer'
})

export default request;



