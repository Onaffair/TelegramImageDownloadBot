import OSS from 'ali-oss';
import {aliOSS} from '../config.js';
const uploadDir = aliOSS.uploadDir;
const ext = 'zip'

const client = new OSS({
    region: aliOSS.region,
    accessKeyId: aliOSS.accessKeyId,
    accessKeySecret: aliOSS.accessKeySecret,
    bucket: aliOSS.bucket
})
const baseUrl = aliOSS.baseUrl
async function isExistInOSS(packName){
    const objKey = `${uploadDir}/${packName}.${ext}`
    try {
        await client.head(objKey)
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

export {
    uploadZIP,
    isExistInOSS
};


