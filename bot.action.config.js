import bot from './bot.config.js';
import {downloadAndConvertSticker, downloadWholeStickers} from "./utils/imageHandler.js";
import {uploadZIP, isExistInOSS} from "./utils/OSSUploader.js";

bot.onText(/\/start/,(msg) =>{
    const chatId = msg.chat.id
    bot.sendMessage(chatId,"欢迎使用Onaffair的贴图下载机器人，发送单张图片或者整个贴图的链接可为您下载贴图")
})

bot.on('message',async (msg) =>{
    const chatId = msg.chat.id

    try {
        bot.sendMessage(chatId,'bot正在开发中。。。。。\n' +
            '功能尚未完善')
        if (msg.text == '/start') return
        if (!msg.sticker && !msg.link_preview_options){
            bot.sendMessage(chatId,'请发送贴图或贴图分享的链接')
            return
        }
        if (msg.sticker){
            await bot.sendMessage(chatId,`图片获取中，请耐心等待`)
            const res = await downloadAndConvertSticker(msg.sticker)

            if (res.mime.includes("gif")){ //动图
                await bot.sendAnimation(chatId,res.buffer,{},{
                    filename:res.filename,
                    contentType: res.mime
                })
            }else{ //不动图
                await bot.sendDocument(chatId,res.buffer,{},{filename:res.filename})
            }
        }
        if(msg.link_preview_options){
            const packUrl = msg.link_preview_options.url
            const packName = packUrl.match(/https?:\/\/t\.me\/addstickers\/([^\/\?]+)/)
            if (!packName || !packName[1]){
                await bot.sendMessage(chatId,'非TG贴图链接')
                return
            }
            const pack = await bot.getStickerSet(packName[1])
            console.log("表情包名称",pack.name)
            await bot.sendMessage(chatId,`正在获取${pack.name}的表情贴纸`)

            const isExist = await isExistInOSS(pack.name)
            if (isExist){ //文件已存在
                await bot.sendMessage(chatId,isExist)
                return
            }
            const zipBuffer = await downloadWholeStickers(pack.stickers)
            if (zipBuffer.length / 1024 / 1024 >= 50){ //文件过大，发送url
                const res = await uploadZIP(zipBuffer,pack.name)
                await bot.sendMessage(chatId,res)
                return
            }
            await bot.sendDocument(chatId, zipBuffer, {},{ //发送zip
                filename: `${pack.name}.zip`,
                contentType: 'application/zip'
            })
            console.log("发送完成")
        }
    }catch (e){
        await bot.sendMessage(chatId,e.message)
    }
})


// 错误监听，保证不断线
bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message)
})

bot.on("error", (err) => {
  console.error("Bot error:", err.message)
})