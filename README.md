<div align="center" markdown="1">
  <sup>Special thanks to:</sup>
  <br>
  <a href="https://go.warp.dev/SwitchHosts">
    <img alt="Warp sponsorship" width="400" src="https://github.com/user-attachments/assets/bb4a0222-12bf-4c79-bb80-a8ed4672b801" />
  </a>

### [Warp, the intelligent terminal for developers](https://go.warp.dev/SwitchHosts)
[Available for MacOS, Linux, & Windows](https://go.warp.dev/SwitchHosts)<br>

</div>

---

# SwitchHosts

- [Polski](README.pl.md)
- [简体中文](README.zh_hans.md)
- [繁體中文](README.zh_hant.md)

Homepage: [https://dev.tekin.cn](https://dev.tekin.cn)

SwitchHosts is an App for managing hosts file, it is based on [Electron](http://electron.atom.io/)
, [React](https://facebook.github.io/react/), [Jotai](https://jotai.org/)
, [Chakra UI](https://chakra-ui.com/), [CodeMirror](http://codemirror.net/), etc.

## Screenshot

<img src="https://raw.githubusercontent.com/oldj/SwitchHosts/master/screenshots/sh_light.png" alt="Capture" width="960">

## Features

- Switch hosts quickly
- Syntax highlight
- Remote hosts
- Switch from system tray

## Install

### Download

You can download the source code and build it yourself, or download the built version from following
links:

- [SwitchHosts Download Page (GitHub release)](https://github.com/tekintian/SwitchHosts/releases)

You can also install the built version using the [package manager Chocolatey](https://community.chocolatey.org/packages/switchhosts):
```powershell
choco install switchhosts
```

## Backup

SwitchHosts stores data at `~/.SwitchHosts` (Or folder `.SwitchHosts` under the current user's home
path on Windows), the `~/.SwitchHosts/data` folder contains data, while the `~/.SwitchHosts/config`
folder contains various configuration information.

## Develop and build

### Development

- Install [Node.js](https://nodejs.org/) (>= 18.0.0)
- Change to the folder `./`, run `npm install` to install dependented libraries
- Run `npm run dev` to start the development server
- Then run `npm run start` to start the app for developing or debuging

### Build and package

For detailed build instructions, see [BUILD_GUIDE.md](./BUILD_GUIDE.md).

Quick build (dev mode, skip signing):
```bash
# build
npm run build

# make (dev mode - skip signing and notarization)
npm run make:dev # the packed files will be in ./dist
```

For production builds with code signing, see [BUILD_GUIDE.md](./BUILD_GUIDE.md).

**Note**: It is recommended to use [electron-builder](https://github.com/electron-userland/electron-builder)
  for packaging. This command may take several minutes to finish when you run it the first time, as it needs time
  to download dependent files. You can download the dependencies
  manually [here](https://github.com/electron/electron/releases),
  or [Taobao mirror](https://npmmirror.com/mirrors/electron/), then save the files to `~/.electron`
  . You can check the [Electron Docs](http://electron.atom.io/docs/) for more infomation.

## Contributing

For contribution guidelines and CI/CD information, see [CI_CD_GUIDE.md](./CI_CD_GUIDE.md).

## Security

For security guidelines and best practices, see [SECURITY.md](./SECURITY.md).


## Copyright

SwitchHosts is a free and open source software, it is released under the [Apache License](./LICENSE).
