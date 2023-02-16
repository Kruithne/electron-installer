<p align="center"><img src="docs/electron-installer-logo.png"/></p>

# electron-installer &middot; ![tests status](https://github.com/Kruithne/electron-installer/actions/workflows/github-actions-test.yml/badge.svg) ![typescript](https://img.shields.io/badge/language-typescript-blue) [![license badge](https://img.shields.io/github/license/Kruithne/electron-installer?color=blue)](LICENSE) ![npm version](https://img.shields.io/npm/v/electron-installer?color=blue)

`electron-installer` is a command-line utility written in [Node.js](https://nodejs.org/) that streamlines the process of preparing an [Electron](https://www.electronjs.org/) distribution.

This utility is intended for use in automated build pipelines or for development and testing purposes.

- Supports all platforms, architectures and versions.
- Caches builds to avoid unnecessary downloads.
- Minimal external dependencies: [JSZip](https://www.npmjs.com/package/jszip).

## Installation
```bash
npm install electron-installer -g
```

## Usage
```bash
Usage: electron-installer [options]

Options:
  --help                Show this help message and exit.
  --target-dir          Specify a target directory to install to.
  --version             Specify a version to install (e.g 23.0.0)
  --no-cache            Disable caching of downloaded builds.
  --clear-cache         Clears the cache of downloaded builds.
  --platform <string>   Override the platform to install for.
  --arch <string>       Override the architecture to install for.
  --exclude <pattern>   Exclude files matching the given pattern.
  --locale <a,b,c..>    Define which locales to include in the build (defaults: all).
```

## Documentation

- [Versions](#versions) - Specify a specific version of Electron to install.
- [Target Directory](#target-directory) - Specify a target directory to install to.
- [Platform / Architecture](#platform--architecture) - Override the platform and architecture to install for.
- [Caching](#caching) - Cache downloaded builds to avoid unnecessary downloads.
- [Excluding Files](#excluding-files) - Exclude files from the build.
- [Locales](#locale) - Automatically remove locale files that you won't use.

### Verions

Using the `--version <version>` option you can specify a specific version of Electron to install. This should be a valid version number such as `23.0.0` or `24.0.0-alpha.1`.

```bash
electron-installer --version 24.0.0-alpha.1
```
If no version is specified, the latest stable version will be installed. This is determined by querying the directory listing of the download server.

```bash
electron-installer # No version, latest is installed.
```

### Target Directory

By default, Electron will be installed in the current working directory. To specify your own target directory, use the `--target-dir` option.

```bash
electron-installer --target-dir /path/to/target # Installs to /path/to/target.
```
Keep in mind that files will be overwritten if they already exist in the target directory.

The `--target-directory` option also supports some substitution variables that can be used to dynamically generate the target directory.


| Variable | Description | Example |
| -------- | ----------- | ------- |
| `{version}` | The version of Electron being installed. | `23.0.0` |
| `{platform}` | The platform being installed for. | `win32` |
| `{arch}` | The architecture being installed for. | `x64` |
| `{package}` | The name of the package being installed. | `electron-v24.0.0-alpha.1-win32-arm64` |

```bash
electron-installer --target-dir="/{package}" # Installs to /electron-v23.0.0-win32-x64
electron-installer --target-dir="/{version}/{platform}" # Installs to /23.0.0/win32
```

### Platform / Architecture

By default, the platform and architecture of the current system will be used. If you wish to override this, use the `--platform` and `--arch` options.

```bash
electron-installer --platform win32 --arch x64 # Installs latest stable build for Windows x64.
```

At the time of writing, the following platforms and architectures are supported:
| Platform | Architecture  |
| -------- | ------------- |
| `win32`  | `x64`, `ia32`, `arm64` |
| `linux`  | `x64`, `arm64`, `armv7l` |
| `darwin` | `x64`, `arm64`         |
| `mas`    | `x64`, `arm64`         |

This utility does not validate against this table, and will attempt to download the build regardless of the platform or architecture specified. If the build does not exist, the download will fail.

### Caching

By default, downloaded builds are cached to the operating system's temporary directory. Installing the same version multiple times will re-use the cached build, avoiding unnecessary downloads.

```js
Path: os.tmpdir() + '/electron-installer-cache/' + package
```

To disable this behavior, use the `--no-cache` option. The cache will not be checked or updated when this option is used.

```bash
electron-installer --no-cache # Disables caching.
```

Additionally, the `--clear-cache` option can be used to clear the cache before a build starts. The cache will still be used unless `--no-cache` is also set.

```bash
electron-installer --clear-cache # Clears the cache before installing.
```

### Excluding Files

Providing the `--exclude <pattern>` option allows you to exclude files that match the pattern from the build. The pattern should be a valid [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).

```bash
electron-installer --exclude "^ffmpeg.dll$" # Excludes ffmpeg.dll from the build.
```

Notes on file exclusion:
- The pattern is matched against the file path as it appears inside the ZIP archive, not the final file path on disk.
- To exclude locale files more efficiently, see the [Locales](#locale) section.

### Locale

By default, builds come with locale files for [all languages supported by Chromium](https://chromium.googlesource.com/chromium/src/build/config/+/refs/heads/main/locales.gni). According to the [developer of nw.js](https://github.com/nwjs/nw.js/issues/2244#issuecomment-379977958), it is safe to remove locale files that you won't be using.

`electron-installer` makes this simple with the `--locale <locales>` option, where `<locales>` is a comma-separated list of locales to include.

You can find a list of locales supported by Chromium [here](https://chromium.googlesource.com/chromium/src/build/config/+/refs/heads/main/locales.gni).

```bash
electron-installer --locale "sw,en-GB,en_US"
```

Notes on locale:
- You should use the locale IDs that Chromium uses, not platform-specific variations. For example, don't use `en` (OSX variation) for `en-US`, `electron-installer` will automatically adjust this when installing for OSX.
- The locale files **are** not related to the language content of your application, it is related to the environment in which the application will be deployed. **Do not** exclude locale files unless you are 100% sure of the locale of the computers your application will be deployed onto.
- The use of hyphens and underscores differs between platforms, as such you can use either and `electron-installer` will automatically adjust them depending on the target platform (e.g `en-gb` == `en_gb`).
- Locale flags are case-insensitive (e.g `en-GB` == `en-gb`).

## Contributing / Feedback / Issues
Feedback, bug reports and contributions are welcome. Please use the [GitHub issue tracker](https://github.com/Kruithne/electron-installer/issues) and follow the guidelines found in the [CONTRIBUTING](CONTRIBUTING.md) file.

## License
The code in this repository is licensed under the ISC license. See the [LICENSE](LICENSE) file for more information.