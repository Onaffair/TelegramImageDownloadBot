/**
 * 统一配置文件
 * 集中管理所有项目配置
 */

// Telegram Bot配置
const telegram = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    proxy: 'http://127.0.0.1:7897',
    polling: {
        enabled: true,
        options: {
            interval: 1000,      // 拉取间隔
            autoStart: true,     // 启动时立即开始
            params: {
                timeout: 10      // 长轮询超时
            }
        }
    }
};

// 阿里云OSS配置
const aliOSS = {
    accessKeyId: process.env.ALIYUN_ACCESSKEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESSKEY_SECRET,
    region: 'oss-cn-hangzhou',
    bucket: 'onaffair',
    uploadDir: 'ZIP',
    fileExt: 'zip',
    baseUrl: 'http://onaffair.oss-cn-hangzhou.aliyuncs.com'
};

// 图片处理配置
const imageProcessing = {
    concurrencyLimit: 5, // 并发处理限制
    gif: {
        fps: 30,
        scale: '512:-1',
        quality: 'lanczos'
    }
};

// HTTP请求配置
const http = {
    proxy: telegram.proxy
};

// 导出所有配置
export {
    telegram,
    aliOSS,
    imageProcessing,
    http
};