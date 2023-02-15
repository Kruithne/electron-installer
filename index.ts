#!/usr/bin/env node
import { parse } from '@kogs/argv';
import log, { formatArray } from '@kogs/logger';
import info from './package.json' assert { type: 'json' };
import path from 'node:path';
import jszip from 'jszip';
import os from 'node:os';
import fs from 'node:fs';

const GITHUB_LATEST_RELEASE_URL: string = 'https://api.github.com/repos/electron/electron/releases/latest';
const GITHUB_DOWNLOAD_URL: string = 'https://github.com/electron/electron/releases/download';

try {
	const argv = parse();

	log.info('electron-installer {%s}', info.version);
	log.blank();

	argv.help({
		usage: 'Usage: $ electron-installer [{options}]',
		url: info.homepage,
		entries: [
			{ name: '--help', description: 'Show this help message and exit.' },
			{ name: '--target-dir', description: 'Specify a target directory to install to.' },
			{ name: '--version', description: 'Specify a version to install (e.g 22.2.1)' },
			{ name: '--no-cache', description: 'Disable caching of downloaded builds.' },
			{ name: '--clear-cache', description: 'Clears the cache of downloaded builds.' },
			{ name: '--platform <{string}>', description: 'Override the platform to install for.' },
			{ name: '--arch <{string}>', description: 'Override the architecture to install for.' },
			{ name: '--exclude <{pattern}>', description: 'Exclude files matching the given pattern.' },
			{ name: '--locale <{a},{b},{c}..>', description: 'Define which locales to include in the build (defaults: all).' },
		]
	});

	const cacheDir: string = path.join(os.tmpdir(), 'electron-installer-cache');
	if (argv.options.asBoolean('clearCache')) {
		log.info('Clearing build cache ({--clear-cache})...');
		fs.rmdirSync(cacheDir, { recursive: true });
		log.success('Cleared build cache {%s}', cacheDir);
	}

	let didAutoDetectVersion: boolean = false;
	let targetVersion: string = argv.options.asString('version');
	if (targetVersion === undefined) {
		// Target version not provided, attempt to auto-detect latest version.
		const latestJSON = await fetch(GITHUB_LATEST_RELEASE_URL).then(res => res.json());

		targetVersion = latestJSON.tag_name.replace(/^v/, '');
		didAutoDetectVersion = true;
	} else {
		// Remove 'v' prefix if provided.
		if (targetVersion.startsWith('v'))
			targetVersion = targetVersion.slice(1);
	}

	let didAutoDetectPlatform: boolean = false;
	let didAutoDetectArch: boolean = false;

	let platform: string = argv.options.asString('platform');
	if (platform === undefined) {
		// Automatically detect platform if not provided.
		didAutoDetectPlatform = true;
		platform = process.platform;
	}

	let arch: string = argv.options.asString('arch');
	if (arch === undefined) {
		// Automatically detect arch if not provided.
		didAutoDetectArch = true;
		arch = process.arch;
	}

	let targetDir: string = argv.options.asString('targetDir') ?? process.cwd();
	const useCache: boolean = !argv.options.asBoolean('noCache');
	const locale: string[] = argv.options.asArray('locale') ?? [];
	const excludePattern: string | undefined = argv.options.asString('exclude') ?? undefined;

	const prefixedVersion: string = 'v' + targetVersion;
	const packageName: string = 'electron-' + prefixedVersion + '-' + platform + '-' + arch;

	const tokens = {
		'{version}': targetVersion,
		'{platform}': platform,
		'{arch}': arch,
		'{package}': packageName,
	};

	// Replace all tokens
	targetDir = targetDir.replace(/{version}|{platform}|{arch}|{package}/g, (match) => tokens[match]);

	log.info('Installing Electron in {%s}', targetDir);
	log.info('Target Version: {%s}' + (didAutoDetectVersion ? ' (auto-detected)' : ''), targetVersion);
	log.info('Target Platform: {%s}' + (didAutoDetectPlatform ? ' (auto-detected)' : ''), platform);
	log.info('Target Arch: {%s}' + (didAutoDetectArch ? ' (auto-detected)' : ''), arch);
	log.info('Locale: ' + (locale.length > 0 ? formatArray(locale) : '{all}'));
	if (excludePattern !== undefined)
		log.info('Excluding: {%s}', excludePattern);

	log.blank();

	if (!useCache)
		log.warn('You have disabled caching with {--no-cache}, distribution will be downloaded every time.');

	const fileName: string = packageName + '.zip';
	const downloadURL: string = GITHUB_DOWNLOAD_URL + '/' + prefixedVersion + '/' + fileName;
	const cachePath: string = path.join(cacheDir, fileName);

	// Ensure cache directory exists.
	fs.mkdirSync(cacheDir, { recursive: true });

	let data: Buffer | undefined;
	if (useCache && fs.existsSync(cachePath)) {
		log.info('Using cached version {%s}', cachePath);
		data = fs.readFileSync(cachePath);
	} else {
		log.info('Downloading archive from {%s}', downloadURL);

		const res = await fetch(downloadURL);
		if (!res.ok)
			throw new Error('Download server returned HTTP {' + res.status + '}: ' + res.statusText);

		data = Buffer.from(await res.arrayBuffer());

		if (useCache) {
			fs.writeFileSync(cachePath, data);
			log.info('Caching archive at {%s}', cachePath);
		}
	}

	// Lowercase all provided locales for comparison.
	let localeStrings = locale.map(e => e.toLowerCase());
	
	// OSX uses underscores instead of hyphens, and 'en-US' is 'en'.
	// See: https://chromium.googlesource.com/chromium/src/build/config/+/refs/heads/main/locales.gni#250
	localeStrings = localeStrings.map(platform === 'darwin' ? e => e.replace('-', '_') : e => e.replace('_', '-'));
	if (platform === 'darwin') {
		if (localeStrings.includes('en_us'))
			localeStrings.push('en');
	}

	const localeFilter = (entry: string) => {
		const skipLocale = locale.length === 0;
		if (skipLocale)
			return true;

		let match: RegExpMatchArray | null;
		if (platform === 'darwin' || platform === 'mas') {
			match = entry.match(/^Electron.app\/Contents\/Resources\/([^.]+)\.lproj\/InfoPlist.strings$/);
		} else {
			match = entry.match(/^locales\/([^.]+)\.pak$/);
		}

		return skipLocale || (match ? localeStrings.includes(match[1].toLowerCase()) : true);
	};

	const excludeRegExp = excludePattern ? new RegExp(excludePattern, 'i') : undefined;
	
	const zip = await jszip.loadAsync(data);
	const promises = [];

	zip.forEach((entryPath, entry) => {
		// Skip directories.
		if (entry.dir)
			return;

		const filePath = path.join(targetDir, entryPath);
		const fileDir = path.dirname(filePath);

		if (!localeFilter(entryPath)) {
			log.info('Skipping {%s} (does not match --locale)', filePath);
			return;
		}

		if (excludeRegExp && excludeRegExp.test(entryPath)) {
			log.info('Skipping {%s} (matches --exclude)', filePath);
			return;
		}

		// Ensure directory exists.
		fs.mkdirSync(fileDir, { recursive: true });

		// Write file.
		const stream = entry.nodeStream();
		promises.push(new Promise<void>(resolve => {
			stream.on('end', () => {
				log.success('Extracted {%s}', filePath);
				resolve();
			});
		}));

		stream.pipe(fs.createWriteStream(filePath));
	});

	await Promise.all(promises);
} catch (err) {
	log.error('{Failed} %s: ' + err.message, err.name);
	process.exit(1);
}