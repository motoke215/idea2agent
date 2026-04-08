# 灵感炼金炉 · Idea2Agent (Android App)

将模糊的产品想法炼制为 PRD 文档与分步开发指令。

## 开发运行

```bash
npm install
npx expo start
```

扫描终端中的二维码，用 **Expo Go** App 在手机上预览。

## 打包为 Android APK

### 方法一：EAS Build（推荐，免安装 Android SDK）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号（免费注册）
eas login

# 初始化构建配置
eas build:configure

# 构建 APK（约 5-15 分钟，云端构建）
eas build -p android --profile preview
```

构建完成后会给出下载链接，直接安装到手机。

### 方法二：本地构建（需要 Android Studio）

```bash
# 生成原生项目
npx expo prebuild --platform android

# 进入 android 目录构建
cd android
./gradlew assembleRelease

# APK 位置
# android/app/build/outputs/apk/release/app-release.apk
```

### eas.json 参考配置

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

## 功能说明

| 功能 | 说明 |
|------|------|
| 输入 Tab | 填写产品想法，示例快速填充 |
| 结果 Tab | 展示 PRD 文档，支持复制指令、下载 MD、重新生成 |
| 配置 Tab | 填写 API Key（自动持久化到本地），支持 DeepSeek / OpenAI / 自定义端点 |

## 支持的 API

- **DeepSeek**：https://platform.deepseek.com/
- **OpenAI**：https://platform.openai.com/
- **自定义**：任何兼容 OpenAI 格式的端点
