# 声声悦耳 · 学习助手

给孩子用的三科学习应用：**数学**（出题→作答→判题→讲解→错题闭环）、**识字**（生字卡/听写）、**英语**（单词卡/听写/发音）。全部数据驱动、判题本地完成、讲解模型可插拔。

## 技术架构

- Vue 3 + TypeScript + Vite + Pinia
- Capacitor 6（Android 壳，签名 release 打包）
- IndexedDB（答题记录、掌握度、讲解缓存、设置）
- Web Speech API（识字/英语发音与跟读）
- 可插拔 LLM：电脑本地 Ollama（同一 WiFi）/ 云端 OpenAI 兼容接口 / 纯离线预设，失败自动降级
- 数据备份导出/导入实现跨设备迁移

## 核心设计

- **非硬编码**：题型/字库/词库全部配置化（`src/core/templates.ts`、`literacy-data.ts`、`english-data.ts`），加内容只加配置不改代码。
- **程序判题**：答案对错由程序判定，LLM 只负责讲解，不参与判题（避免模型算错误导孩子）。
- **掌握度**：简化 BKT 模型，按答题结果更新各知识点掌握度，优先补薄弱点。
- **错题复习**：间隔重复 + 变式题巩固，覆盖三科。
- **LLM 可插拔**：统一 `complete()` 接口，本地/云端/预设可切换，超时自动回退。

## 命令

```bash
npm install
npm test          # 运行单元测试（42 项）
npm run build     # 类型检查 + 构建
npm run dev       # 本地开发
npm run cap:sync  # 同步 web 资源到 android
```

## 打包签名 Release APK

前置条件：安装 Android Studio（含 Android SDK，设置 `ANDROID_HOME`）、JDK 17。

本机已生成签名密钥 `android/keystore/shengshengyueer.jks`（密码 `shengsheng2026`，别名 `shengshengyueer`）。该密钥含私钥，已被 `.gitignore` 忽略，请勿提交到公开仓库。

一键打包：

```powershell
.\build-release.ps1
```

产物：`shengshengyueer-learn-release.apk`（已签名，可直接安装）。

CI 打包：在 GitHub 仓库 Secrets 配置 `RELEASE_KEYSTORE_B64`（keystore 的 base64）、`RELEASE_STORE_PASSWORD`、`RELEASE_KEY_ALIAS`、`RELEASE_KEY_PASSWORD`，手动触发 `Build Signed Release APK` 工作流即可产出签名包。

构建已配置阿里云 Maven 镜像，改善国内依赖下载。

## 电脑本地模型（Ollama）

1. 电脑安装 Ollama 并下载模型：`ollama pull qwen2.5:7b`
2. 设置环境变量 `OLLAMA_HOST=0.0.0.0:11434` 后重启 Ollama（Windows 在系统环境变量中设置）。
3. 防火墙放行 11434 端口，路由器给电脑绑定固定 IP。
4. App 设置页填写 `http://电脑IP:11434` 与模型名，选择“电脑本地”。
5. 手机与电脑需在同一 WiFi；连接失败会自动回退到预设解析。

云端模式填写任意 OpenAI 兼容接口与 API Key，API Key 仅存本机 IndexedDB。

## 跨设备迁移

设置页“数据备份与迁移”：导出 JSON 备份文件 → 拷到另一台设备 → 导入，即可迁移学习进度、错题与掌握度。

## 目录

```
src/core/       出题/判题/表达式/掌握度/复习 + 识字/英语引擎与词库
src/llm/        LLM 提供方与降级链
src/storage/    IndexedDB 封装与备份导入导出
src/stores/     Pinia 状态
src/components/ 数学/识字/英语/错题/进度/设置界面
android/        Capacitor Android 工程（含签名配置）
```
