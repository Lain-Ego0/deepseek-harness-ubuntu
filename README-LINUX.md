# DeepSeek Assistant · Linux 桌面版（社区版）

非官方 Ubuntu 适配。官方桌面端只发布 macOS/Windows；本项目是官方 `deepseek-ai/deepseek-harness` 的下游打包，不改 agent 内核。

## 安装（Ubuntu 24.04 / 22.04）

**一键添加 APT 仓库**（推荐，自动更新）：

```bash
curl -fsSL https://<apt-base-url>/install.sh | sudo bash
sudo apt install deepseek-assistant
```

**手动 deb**：

```bash
wget <releases-url>/deepseek-harness-<version>-linux-amd64-unsigned.deb
sudo dpkg -i deepseek-harness-*.deb
sudo apt -f install   # 依赖缺失时自动补齐
```

**AppImage**（免安装）：

```bash
chmod +x deepseek-harness-*-linux-x86_64-unsigned.AppImage
./deepseek-harness-*-linux-x86_64-unsigned.AppImage
```

## 构建（从源码）

```bash
pnpm install
./scripts/linux/package-ubuntu.sh x64    # 或 arm64
```

产物位于 `apps/desktop/.desktop-build/targets/linux-*/unsigned-artifacts/`。

## 与上游的差异（全部为打包层）

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

## 已知限制

- 应用内自动更新走 apt 通道（deb）或 GitHub Releases（AppImage 手动升级）；官方 electron-updater 通用通道需自建 HTTPS feed
- 必须使用 `--profile local` 构建（官方未给 Linux 签名/公证路径）
- Office 文档转换（DOCX/XLSX/PPTX→PDF）已验证可用

## 许可

MIT（继承上游）
