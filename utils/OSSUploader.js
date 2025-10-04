const accessKeyId = process.env.ALIYUN_ACCESSKEY_ID
const accessKeySecret = process.env.ALIYUN_ACCESSKEY_SECRET
const OSS = require('ali-oss')
const {resolve} = require("ali-oss/shims/url");
const uploadDir = "ZIP"
const ext = 'zip'

const client = new OSS({
    region:'oss-cn-hangzhou',
    accessKeyId,
    accessKeySecret,
    bucket:'onaffair'
})
const baseUrl = 'http://onaffair.oss-cn-hangzhou.aliyuncs.com'
async function isExistInOSS(packName){
    const objKey = `${uploadDir}/${packName}.${ext}`
    try {
        const res = await client.head(objKey)
        return  `${baseUrl}/${objKey}`
    }catch (e){
        return false
    }
}


async function uploadZIP(buffer,packName){
    const objKey = `${uploadDir}/${packName}.${ext}`
    const res = await client.put(objKey,buffer)
    return res.url
}

module.exports = {uploadZIP,isExistInOSS}


