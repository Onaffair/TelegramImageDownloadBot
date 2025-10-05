

# Telegram Sticker Bot

## 机器人地址
t.me/onaffair_bot

## 功能介绍
这是一个 Telegram 贴纸处理机器人，可以将贴纸转换为图片格式并下载。

## 本地部署指南

### 环境要求
- Node.js 14.0 或更高版本
- npm 或 yarn 包管理器

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 配置说明
所有配置已集中在 `config.js` 文件中管理，您需要配置以下内容：

#### 1. Telegram Bot 配置
- 在 [BotFather](https://t.me/BotFather) 创建一个机器人并获取 token
- 设置环境变量 `TELEGRAM_BOT_TOKEN` 或直接在 config.js 中修改
- 根据需要调整代理设置

```javascript
// config.js 中的 telegram 配置部分
const telegram = {
    token: process.env.TELEGRAM_BOT_TOKEN, // 替换为您的机器人token
    proxy: 'http://127.0.0.1:7897',        // 替换为您的代理地址和端口
    // 其他配置...
};
```

#### 2. 阿里云 OSS 配置
- 创建阿里云 OSS 账号和存储桶
- 设置环境变量 `ALIYUN_ACCESSKEY_ID` 和 `ALIYUN_ACCESSKEY_SECRET`
- 或直接在 config.js 中修改相关配置

```javascript
// config.js 中的 aliOSS 配置部分
const aliOSS = {
    accessKeyId: process.env.ALIYUN_ACCESSKEY_ID,       // 替换为您的 AccessKey ID
    accessKeySecret: process.env.ALIYUN_ACCESSKEY_SECRET, // 替换为您的 AccessKey Secret
    region: 'oss-cn-hangzhou',              // 替换为您的 OSS 区域
    bucket: 'onaffair',                     // 替换为您的 OSS 存储桶名称
    // 其他配置...
};
```

#### 3. 图片处理配置
可以根据需要调整图片处理参数：

```javascript
// config.js 中的 imageProcessing 配置部分
const imageProcessing = {
    concurrencyLimit: 5, // 并发处理限制
    gif: {
        fps: 30,         // 帧率
        scale: '512:-1', // 缩放比例
        quality: 'lanczos' // 质量设置
    }
};
```

### 启动服务
```bash
node index.js
```

## 开发指南

### 项目结构
- `config.js`: 集中配置文件
- `index.js`: 程序入口
- `bot.config.js`: Telegram Bot 初始化
- `bot.action.config.js`: Bot 命令和动作处理
- `error.config.js`: 错误处理配置
- `utils/`: 工具函数目录
  - `imageHandler.js`: 图片处理工具
  - `OSSUploader.js`: 阿里云 OSS 上传工具
  - `request.js`: HTTP 请求工具
  - `logger.js`: 日志工具

### 添加新功能
如需添加新的 Bot 命令，请在 `bot.action.config.js` 中添加相应的处理逻辑。
