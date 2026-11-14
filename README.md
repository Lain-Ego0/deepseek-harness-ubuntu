<!-- FORK NOTICE: Ubuntu packaging fork of deepseek-ai/deepseek-harness -->

<div align="center">

# DeepSeek Harness · Ubuntu 社区版

**Unofficial Ubuntu packaging** — AppImage · `.deb` · APT repository

Fork of [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) · not affiliated with DeepSeek AI

[![CI Ubuntu](https://github.com/Lain-Ego0/deepseek-harness-ubuntu/actions/workflows/ubuntu-package.yml/badge.svg)](./.github/workflows/ubuntu-package.yml)
[![Latest Release](https://img.shields.io/github/v/release/Lain-Ego0/deepseek-harness-ubuntu?include_prereleases&label=release&sort=semver)](https://github.com/Lain-Ego0/deepseek-harness-ubuntu/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

---

> [!IMPORTANT]
> **官方桌面端只发布 macOS 和 Windows**。本仓库在官方 `master` 之上补齐 **Ubuntu 打包层**（不改 agent 内核），保留上游全部 agent / 插件 / Web UI 能力。

## 安装（Ubuntu 24.04 / 22.04）

### GitHub Release 下载（推荐）

到 [Releases](https://github.com/Lain-Ego0/deepseek-harness-ubuntu/releases) 页面下载最新的 `deepseek-harness-*-linux-amd64-unsigned.deb`：

```bash
sudo dpkg -i deepseek-harness-*.deb
sudo apt -f install   # 依赖缺失时自动补齐
```

升级 = 下载新 deb + `dpkg -i`。GitHub Actions 每日 UTC 20:00 自动 merge 上游并构建；手动升级可自己打 tag 触发。

### AppImage（免安装）

### AppImage（免安装）

```bash
chmod +x deepseek-harness-*-linux-x86_64-unsigned.AppImage
./deepseek-harness-*-linux-x86_64-unsigned.AppImage
```

> AppImage 首次启动如果提示 sandbox 错误：`chmod 4755` 里面的 `chrome-sandbox`，或加 `--no-sandbox`（不推荐）。

## 从源码构建

```bash
pnpm install
./scripts/linux/package-ubuntu.sh x64    # 或 arm64
```

产物输出到 `apps/desktop/.desktop-build/targets/linux-*/unsigned-artifacts/`。

## Fork 初始化（一次性）

1. **启用 Actions**：Settings → Actions → General → Allow all actions
2. **禁用上游 workflow**（自动完成）：`ubuntu-package.yml` 里的 `disable-upstream` job 会在每日 schedule 或手动触发时自动禁用上游的 34 个 workflow，只需等它跑一次即可（首次约 5 分钟）。也可手动用 `./scripts/ci/disable-upstream-workflows.sh`（需 gh CLI）。
3. **无其他配置**：GitHub Releases 默认开启；每日 UTC 20:00 自动构建。

## CI 自动发布

`.github/workflows/ubuntu-package.yml`：

| 触发 | 动作 |
|---|---|
| 每天 UTC 20:00（北京时间 04:00） | merge upstream/master → 构建 AppImage + deb → artifacts 保留 7 天 |
| `push` tag `ubuntu-v*` | 构建 → 发布 GitHub Release（deb + AppImage + SHA256SUMS） |
| `workflow_dispatch` | 手动触发（含 sync） |

无需任何 secret 配置。


## 与上游的差异（全部为打包层）

<details>
<summary>9 个文件改动（点击展开）</summary>

| 文件 | 变更 |
|---|---|
| `apps/desktop/scripts/desktop-build-paths.mjs` | SUPPORTED_TARGETS 加入 linux-x64/linux-arm64 |
| `apps/desktop/scripts/prepare-runtime.ts` | Electron 可执行文件路径加 linux 分支 |
| `apps/desktop/scripts/prepare-dsh.ts` | 同上 |
| `apps/desktop/src/main.ts` | 策略平台检查 + platformView 平台分支加 linux |
| `apps/desktop/src/mandatory-update-policy.ts` | platform 类型加 linux |
| `packages/credentials/deepseek-account/src/client-metadata.ts` | 请求头加 desktop-linux |
| `packages/credentials/deepseek-account/src/index.ts` | platform 类型加 linux |
| `apps/desktop/src/platform-view.ts` | platform 类型加 linux |
| `apps/desktop/scripts/electron-builder-config.mjs` | linux target 加 deb + maintainer/vendor |

</details>

## 已知限制

- 应用内自动更新走 apt 通道（deb）或 GitHub Releases（AppImage 手动升级）；官方 electron-updater 通用通道需自建 HTTPS feed
- 必须使用 `--profile local` 构建（官方未提供 Linux 签名/公证路径）
- Office 文档转换（DOCX/XLSX/PPTX→PDF）**已验证可用**

## 上游完整文档

完整上游说明（含架构、插件、API 等）见 [`README.md.upstream`](./README.md.upstream)，或访问 [deepseek-harness 文档站](https://deepseek-harness.github.io/deepseek-harness/)。

## 许可

MIT（继承上游）
