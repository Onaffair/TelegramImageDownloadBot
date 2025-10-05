import bot from '../bot.config.js';
import sharp from 'sharp';
import request from './request.js';
import ffmpeg from 'fluent-ffmpeg';
import {PassThrough} from "node:stream";
import JSZip from 'jszip';
import {imageProcessing} from '../config.js';

import gzipPkg from 'node-gzip'
const {ungzip} = gzipPkg


import pLimit from 'p-limit';
const limit = pLimit(imageProcessing.concurrencyLimit);


ffmpeg.setFfmpegPath('D:\\ffmpeg\\bin\\ffmpeg.exe')

async function downloadFileBuffer(fileUrl){
    const res = await request.get(fileUrl);
    return Buffer.from(res.data);
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
                // 调整帧率并保持时长
                `fps=${imageProcessing.gif.fps},scale=${imageProcessing.gif.scale}:flags=${imageProcessing.gif.quality},setpts=PTS*(${60 / imageProcessing.gif.fps})`
            ])
            .outputOptions([
                '-loop', '0',
                '-gifflags', '+transdiff',
                '-lossless', '1'
            ])
            .outputFormat('gif')
            .pipe(outputStream, { end: true })
            .on('error', reject);

    });
}

/**
 * 1️⃣ 将 tgsBuffer 转成 WebM buffer
 */
async function convertTgsBufferToWebmBuffer(tgsBuffer) {
    // 1️⃣ 解压 tgs -> Lottie JSON
    const jsonBuffer = await ungzip(tgsBuffer);
    const lottieJson = JSON.parse(jsonBuffer.toString('utf-8'));

    // 2️⃣ 启动 puppeteer 渲染 Lottie
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setContent(`
        <html>
        <body style="margin:0; padding:0; overflow:hidden;">
            <canvas id="canvas"></canvas>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.11.3/lottie.min.js"></script>
            <script>
                window.lottieJson = ${JSON.stringify(lottieJson)};
            </script>
        </body>
        </html>
    `);

    const frames = await page.evaluate(async () => {
        const canvas = document.getElementById('canvas');
        const anim = lottie.loadAnimation({
            container: canvas,
            renderer: 'canvas',
            loop: false,
            autoplay: true,
            animationData: window.lottieJson
        });

        const frameCount = anim.totalFrames;
        const fps = 30; // 可根据需要调整
        const capturedFrames = [];

        anim.goToAndStop(0, true);
        for (let i = 0; i < frameCount; i++) {
            anim.goToAndStop(i, true);
            capturedFrames.push(canvas.toDataURL('image/png'));
        }

        return capturedFrames;
    });

    await browser.close();

    // 3️⃣ 将 frames 转为 buffer，并用 ffmpeg 输出 webm
    return new Promise((resolve, reject) => {
        const outputStream = new PassThrough();
        const chunks = [];
        outputStream.on('data', chunk => chunks.push(chunk));
        outputStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputStream.on('error', reject);

        const ffmpegCommand = ffmpeg();

        frames.forEach((frameDataUrl, i) => {
            const base64 = frameDataUrl.replace(/^data:image\/png;base64,/, '');
            const frameBuffer = Buffer.from(base64, 'base64');
            ffmpegCommand.input(new PassThrough().end(frameBuffer))
                .inputFormat('image2pipe');
        });

        ffmpegCommand
            .outputOptions([
                '-c:v libvpx-vp9',
                `-r 30`,
                '-pix_fmt yuva420p'
            ])
            .format('webm')
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
    const {file_id: fileId} = sticker;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    console.log(fileUrl);
    const buffer = await downloadFileBuffer(fileUrl);

    if (sticker.is_animated || sticker.is_video) {
        let gifBuffer = null
        if (file.file_path.endsWith('.tgs')){
            // gifBuffer  = await convertTgsBufferToWebmBuffer(buffer)
            // console.log(gifBuffer)
            throw new Error('暂不支持该类贴图的转换')
        }else{
            gifBuffer = await convertWebmBufferToGifBuffer(buffer);
        }
        return { buffer: gifBuffer, type: 'animation', mime: 'image/gif', filename:`${fileId}.gif`};
    } else {
        const pngBuffer = await convertWebpBufferToPngBuffer(buffer);
        // fs.writeFileSync(`${fileId}.png`, pngBuffer)
        return { buffer: pngBuffer, type: 'photo', mime: 'image/png', filename:`${fileId}.png` };
    }
}

//zip
async function downloadWholeStickers(stickers){
    const zip = new JSZip();
    const fnArr = stickers.map((sticker) =>
        limit(() =>
            downloadAndConvertSticker(sticker)
                .then(res => zip.file(res.filename, res.buffer))
                .catch(()=>{})
        )
    );
    await Promise.allSettled(fnArr);
    const res = await zip.generateAsync({type:'nodebuffer'});
    return res;
}

export {
    downloadAndConvertSticker,
    downloadWholeStickers
};




