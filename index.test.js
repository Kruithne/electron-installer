import { expect, test, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const TEST_DIR = './tmp';
const CACHE_DIR = path.join(os.tmpdir(), 'electron-installer-cache');
const EXEC_OPTS = { cwd: TEST_DIR };

beforeAll(() => {
	// Wipe cache directory in case it exists from a previous test run or development.
	if (fs.existsSync(CACHE_DIR))
		fs.rmdirSync(CACHE_DIR, { recursive: true });
});

beforeEach(() => {
	// Wipe test directory in case it exists from a previous test run.
	if (fs.existsSync(TEST_DIR))
		fs.rmdirSync(TEST_DIR, { recursive: true });

	fs.mkdirSync(TEST_DIR);
});

afterEach(() => {
	// Clean up the test directory.
	if (fs.existsSync(TEST_DIR))
		fs.rmdirSync(TEST_DIR, { recursive: true });
});

test('cmd: electron-installer', () => {
	// Expect default behavior:
	// - Electron will be installed into the current working directory (which is TEST_DIR).
	// - Latest version of Electron will automatically be downloaded.
	// - Architecture / platform will be automatically detected.
	// - ZIP will be cached in the operating system's temp directory.
	// - Build should not be a pre-release.
	execSync(`electron-installer`, EXEC_OPTS);

	// Expect the Electron executable to be in the current working directory.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app'))).toBe(true);

	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.length).toBe(1);
	expect(cacheFiles[0]).toMatch(/electron-v\d+\.\d+\.\d+-\w+-\w+\.zip/);
});

test('cmd: electron-installer --version 22.2.1', () => {
	// Expect the specified version to be installed.
	execSync(`electron-installer --version 22.2.1`, EXEC_OPTS);

	if (process.platform === 'linux') {
		expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'chrome_100_percent.pak'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'chrome_200_percent.pak'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'resources.pak'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'snapshot_blob.bin'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'v8_context_snapshot.bin'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'LICENSE'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'LICENSES.chromium.html'))).toBe(true);
		expect(fs.readFileSync(path.join(TEST_DIR, 'version'), 'utf8')).toBe('22.2.1');
		expect(fs.existsSync(path.join(TEST_DIR, 'icudtl.dat'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'libffmpeg.so'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'libEGL.so'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'libGLESv2.so'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'libvk_swiftshader.so'))).toBe(true);
	} else if (process.platform === 'win32') {
		expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'LICENSE'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'LICENSES.chromium.html'))).toBe(true);
		expect(fs.readFileSync(path.join(TEST_DIR, 'version'), 'utf8')).toBe('22.2.1');
		expect(fs.existsSync(path.join(TEST_DIR, 'chrome_100_percent.pak'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'chrome_200_percent.pak'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'd3dcompiler_47.dll'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'ffmpeg.dll'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'icudtl.dat'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'libEGL.dll'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'libGLESv2.dll'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'resources.pak'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'snapshot_blob.bin'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'v8_context_snapshot.bin'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'vk_swiftshader.dll'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'vk_swiftshader_icd.json'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'vulkan-1.dll'))).toBe(true);
	} else if (process.platform === 'darwin') {
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'Resources', 'LICENSE'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'Resources', 'LICENSES.chromium.html'))).toBe(true);
		expect(fs.readFileSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'Resources', 'version'), 'utf8')).toBe('22.2.1');
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'Info.plist'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'PkgInfo'))).toBe(true);
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'MacOS', 'Electron'))).toBe(true);
	}

	// Cache should contain the exact version specified.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.find(e => e.match(/electron-v22\.2\.1-\w+-\w+\.zip/))).not.toBeUndefined();
});

test('cmd: electron-installer --version 22.2.1 (cache check)', () => {
	// Get the mtime of the cache file.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	const cacheFile = cacheFiles.find(e => e.match(/electron-v22\.2\.1-\w+-\w+\.zip/));
	const cacheFileMtime = fs.statSync(path.join(CACHE_DIR, cacheFile)).mtimeMs;

	// Run the command.
	execSync(`electron-installer --version 22.2.1`, EXEC_OPTS);

	// Cache file should not have been modified.
	expect(fs.statSync(path.join(CACHE_DIR, cacheFile)).mtimeMs).toBe(cacheFileMtime);

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app'))).toBe(true);
});

test('cmd: electron-installer --version 22.2.1 --no-cache', () => {
	// Purposely poison the cache so that we can test that it's not used.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	const cacheFile = cacheFiles.find(e => e.match(/electron-v22\.2\.1-\w+-\w+\.zip/));
	fs.writeFileSync(path.join(CACHE_DIR, cacheFile), 'poisoned');

	// Run the command.
	execSync(`electron-installer --version 22.2.1 --no-cache`, EXEC_OPTS);

	// Cache file should be untouched.
	expect(fs.readFileSync(path.join(CACHE_DIR, cacheFile), 'utf8')).toBe('poisoned');

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app'))).toBe(true);

	// Delete the poisoned cache file.
	fs.unlinkSync(path.join(CACHE_DIR, cacheFile));
});

test('cmd: electron-installer --version v24.0.0-alpha.1 (pre-release)', () => {
	// Run the command.
	execSync(`electron-installer --version v24.0.0-alpha.1`, EXEC_OPTS);

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app'))).toBe(true);

	// Cache should contain the exact version specified.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.find(e => e.match(/electron-v24\.0\.0-alpha\.1-\w+-\w+\.zip/))).not.toBeUndefined();
});

test('cmd: electron-installer --version 22.2.1 --platform win32 --arch x64', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --platform win32 --arch x64`, EXEC_OPTS);

	// Check Electron was installed.
	expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);

	// Cache should contain the exact platform and arch specified.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.find(e => e.match(/electron-v22\.2\.1-win32-x64\.zip/))).not.toBeUndefined();
});

test('cmd: electron-installer --version 22.2.1 --platform win32 --arch ia32', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --platform win32 --arch ia32`, EXEC_OPTS);

	// Check Electron was installed.
	expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);

	// Cache should contain the exact platform and arch specified.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.find(e => e.match(/electron-v22\.2\.1-win32-ia32\.zip/))).not.toBeUndefined();
});

test('cmd: electron-installer --version 22.2.1 --platform linux --arch x64', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --platform linux --arch x64`, EXEC_OPTS);

	// Check Electron was installed.
	expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);

	// Cache should contain the exact platform and arch specified.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.find(e => e.match(/electron-v22\.2\.1-linux-x64\.zip/))).not.toBeUndefined();
});

test('cmd: electron-installer --version 22.2.1 --platform darwin --arch x64', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --platform darwin --arch x64`, EXEC_OPTS);

	// Check Electron was installed.
	expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app'))).toBe(true);

	// Cache should contain the exact platform and arch specified.
	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.find(e => e.match(/electron-v22\.2\.1-darwin-x64\.zip/))).not.toBeUndefined();
});

test('cmd: electron-installer --version 22.2.1 --target-dir="./test"', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --target-dir="./test"`, EXEC_OPTS);

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'test', 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'test', 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'test', 'Electron.app'))).toBe(true);
});

test('cmd: electron-installer --version 22.2.1 --target-dir="./{version}/{platform}/{arch}"', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --target-dir="./{version}/{platform}/{arch}"`, EXEC_OPTS);

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, '22.2.1', 'linux', 'x64', 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, '22.2.1', 'win32', 'x64', 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, '22.2.1', 'darwin', 'x64', 'Electron.app'))).toBe(true);
});

test('cmd: electron-installer --version 22.2.1 --target-dir="./{package}"', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --target-dir="./{package}"`, EXEC_OPTS);

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron-v22.2.1-linux-x64', 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron-v22.2.1-win32-x64', 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron-v22.2.1-darwin-x64', 'Electron.app'))).toBe(true);
});

test('cmd: electron-installer --version 22.2.1 --locale "el,en-GB,en_US"', () => {
	// Run the command.
	execSync(`electron-installer --version 22.2.1 --locale "el,en-GB,en_US"`, EXEC_OPTS);

	// Check if the locale files are the only ones downloaded.
	if (process.platform === 'linux' || process.platform === 'win32') {
		const localeFiles = fs.readdirSync(path.join(TEST_DIR, 'locales'));
		expect(localeFiles.length).toBe(3);

		expect(localeFiles.includes('el.pak')).toBe(true);
		expect(localeFiles.includes('en-GB.pak')).toBe(true);
		expect(localeFiles.includes('en-US.pak')).toBe(true);
	} else if (process.platform === 'darwin') {
		const localeFiles = fs.readdirSync(path.join(TEST_DIR, 'Electron.app', 'Contents', 'Resources'));
		expect(localeFiles.length).toBe(5);
		expect(localeFiles.includes('el.lproj')).toBe(true);
		expect(localeFiles.includes('en_GB.lproj')).toBe(true);
		expect(localeFiles.includes('en.lproj')).toBe(true); // OSX uses en.lproj for en-US.
		
		// Other things included are: default_app.asar, electron.icns
		expect(localeFiles.includes('default_app.asar')).toBe(true);
		expect(localeFiles.includes('electron.icns')).toBe(true);
	}
});

test('cmd: electron-installer --version 22.2.1 --exclude "^LICENSE$"', () => {
	// Use LICENSE for testing since it's the only file that exists in the same
	// directory on all platforms.

	// Run the command.
	execSync(`electron-installer --version 22.2.1 --exclude "^LICENSE$"`, EXEC_OPTS);

	// Check Electron was installed.
	if (process.platform === 'linux')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron'))).toBe(true);
	else if (process.platform === 'win32')
		expect(fs.existsSync(path.join(TEST_DIR, 'electron.exe'))).toBe(true);
	else if (process.platform === 'darwin')
		expect(fs.existsSync(path.join(TEST_DIR, 'Electron.app'))).toBe(true);

	// Check the LICENSE file was excluded.
	expect(fs.existsSync(path.join(TEST_DIR, 'LICENSE'))).toBe(false);
});

// This test should ideally be left until last.
test('cmd: electron-installer --version 22.2.1 --clear-cache', () => {
	// Ensure cache directory exists.
	if (!fs.existsSync(CACHE_DIR))
		fs.mkdirSync(CACHE_DIR);

	// Create a random ZIP file just to ensure the cache has something in it.
	fs.writeFileSync(path.join(CACHE_DIR, 'cacheJunk.zip'), 'junk');

	// Run the command.
	execSync(`electron-installer --version 22.2.1 --clear-cache`, EXEC_OPTS);

	const cacheFiles = fs.readdirSync(CACHE_DIR);
	expect(cacheFiles.length).toBe(1);
	expect(cacheFiles.find(e => e.match(/electron-v22\.2\.1-\w+-\w+\.zip/))).not.toBeUndefined();
	expect(cacheFiles.find(e => e.match(/cacheJunk\.zip/))).toBeUndefined();
});