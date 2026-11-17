# dsh-desktop-ubuntu

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## Ubuntu Desktop packaging

This repository packages the DeepSeek Harness Desktop application for Ubuntu from the upstream `master` branch. It focuses on producing and distributing native Linux Desktop installers; the application retains upstream agent, plugin, and Web UI capabilities.

### Debian package

On Ubuntu 24.04 or 22.04, download the latest `dsh-desktop-ubuntu-*-linux-amd64-unsigned.deb` from [Ubuntu community releases](https://github.com/Lain-Ego0/deepseek-harness-ubuntu/releases), then install it:

```bash
sudo dpkg -i dsh-desktop-ubuntu-*.deb
sudo apt -f install
```

### AppImage

Download the latest x86_64 AppImage from [Ubuntu community releases](https://github.com/Lain-Ego0/deepseek-harness-ubuntu/releases), then run:

```bash
chmod +x dsh-desktop-ubuntu-*-linux-x86_64-unsigned.AppImage
./dsh-desktop-ubuntu-*-linux-x86_64-unsigned.AppImage
```

### Build from source

```bash
pnpm install
./scripts/linux/package-ubuntu.sh x64   # or arm64
```

Artifacts are written to `apps/desktop/.desktop-build/targets/linux-*/unsigned-artifacts/`.

### Automated releases and limitations

GitHub Actions merges upstream and builds daily at 20:00 UTC. Pushing a `ubuntu-v*` tag publishes a release with Ubuntu Desktop Debian and AppImage packages and SHA-256 checksums. Debian packages use the apt upgrade path; AppImage updates require downloading a newer release. Linux builds use the local profile because the upstream signing and notarization path does not support Linux.

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/4MrtZUhpxg">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
