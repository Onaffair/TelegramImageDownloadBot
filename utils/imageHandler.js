const bot = require('../bot.config');
const sharp = require('sharp')
const request = require('./request')
const ffmpeg = require('fluent-ffmpeg')
const {PassThrough} = require("node:stream");
const JSZip = require('jszip')
const fs = require("node:fs");



const pLimit = require("p-limit").default
const limit = pLimit(5)


async function downloadFileBuffer(fileUrl){
    const res = await request.get(fileUrl)
    return Buffer.from(res.data)
}

//webm -> gif
async function convertWebmBufferToGifBuffer(webmBuffer) {
    return new Promise((resolve, reject) => {
        const inputStream = new PassThrough();
        inputStream.end(webmBuffer);

        const outputStream = new PassThrough();
        const chunks = [];

        outputStream.on('data', (chunk) => chunks.push(chunk));
        outputStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputStream.on('error', reject);

        ffmpeg(inputStream)
            .inputFormat('webm')
            .videoFilters([
                'fps=30,scale=512:-1:flags=lanczos'  // 提高到 30fps + 高质量缩放
            ])
            .outputOptions([
                '-loop', '0',           // 不循环
                '-gifflags', '+transdiff', // 改善透明边缘
                '-lossless', '1'        // 尽可能无损
            ])
            .outputFormat('gif')
            .pipe(outputStream, { end: true })
            .on('error', reject);
    });
}




//.tgs -> gif
async function convertTgsToGifBuffer(tgsBuffer) {
    // 1️⃣ 解压 tgs
    const lottieJson = JSON.parse(require('zlib').gunzipSync(tgsBuffer));

    // 2️⃣ 渲染每一帧
    const frames = [];
    const width = 512;
    const height = 512;
    for (let i = 0; i < totalFrames; i++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        renderLottieFrame(lottieJson, i, ctx); // 伪函数
        frames.push(canvas.toBuffer('image/png'));
    }

    // 3️⃣ 用 ffmpeg 把 PNG 帧生成 GIF
    return new Promise((resolve, reject) => {
        const outputStream = new PassThrough();
        const chunks = [];
        outputStream.on('data', (chunk) => chunks.push(chunk));
        outputStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputStream.on('error', reject);

        const command = ffmpeg();
        frames.forEach((frame) => {
            command.input(frame).inputFormat('image2pipe');
        });

        command
            .complexFilter(['fps=15,scale=512:-1:flags=lanczos,split [a][b];[a] palettegen=reserve_transparent=1 [p];[b][p] paletteuse'])
            .outputOptions(['-loop', '0'])
            .outputFormat('gif')
            .pipe(outputStream, { end: true })
            .on('error', reject);
    });
}
async function convertWebpBufferToPngBuffer(webpBuffer) {
    return await sharp(webpBuffer).png({
        compressionLevel: 0, // 禁用 zlib 压缩
        adaptiveFiltering: false, // 不使用自适应滤波
        force: true // 强制输出 PNG
    }).toBuffer();
}


async function downloadAndConvertSticker(sticker) {
    const {file_id: fileId} = sticker
    const file = await bot.getFile(fileId)
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`
    console.log(fileUrl)
    const buffer = await downloadFileBuffer(fileUrl)

    if (sticker.is_animated || sticker.is_video) {
        const gifBuffer = await convertWebmBufferToGifBuffer(buffer);
        return { buffer: gifBuffer, type: 'animation', mime: 'image/gif',filename:`${fileId}.gif`};
    } else {
        const pngBuffer = await convertWebpBufferToPngBuffer(buffer);
        // fs.writeFileSync(`${fileId}.png`, pngBuffer)
        return { buffer: pngBuffer, type: 'photo', mime: 'image/png',filename:`${fileId}.png` };
    }
}


//zip
async function downloadWholeStickers(stickers){
    const zip = new JSZip()
    const fnArr = stickers.map((sticker) =>
        limit(() =>
            downloadAndConvertSticker(sticker)
                .then(res => zip.file(res.filename,res.buffer))
                .catch(()=>{})
        )
    )
    await Promise.allSettled(fnArr)
    const res =await zip.generateAsync({type:'nodebuffer'})
    return res
}


module.exports = {
    downloadAndConvertSticker,
    downloadWholeStickers
}




