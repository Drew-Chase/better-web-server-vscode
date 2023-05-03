import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { outputChannel } from '../extension';

const appDataPath = getAppDataPath();
const cacheLocation = path.join(appDataPath, 'Better Web Server', 'cache');

export async function copyWorkspace(workspace: string) {
    const workspaceCache = getWorkspaceCacheDirectory(workspace);
    outputChannel.appendLine('Copying to cache directory');
    await fs.promises.mkdir(workspaceCache, { recursive: true });
    await copyDir(workspace, workspaceCache);
    await copyDir(path.join(__dirname, "injects"), path.join(workspaceCache), false)
}

async function copyDir(src: string, dest: string, inject: boolean = true) {
    const files = await fs.promises.readdir(src);
    let count = 0;
    for (const file of files) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if ((await fs.promises.stat(srcPath)).isDirectory() && !path.basename(destPath).startsWith('.')) {
            await fs.promises.mkdir(destPath, { recursive: true });
            await copyDir(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath, inject);
        }
        count++;
        if (count >= 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            count = 0;
        }
    }
}

async function copyFile(srcPath: string, destPath: string, inject: boolean = true) {
    if (path.basename(srcPath).startsWith('.')) {
        return;
    }


    const relativePath = path.relative(cacheLocation, destPath);
    if (await areFilesIdentical(srcPath, destPath)) {
        return;
    }

    await copyFileContents(srcPath, destPath, inject);
    outputChannel.appendLine(`Copied file: ${relativePath}`);
}

async function copyFileContents(srcPath: string, destPath: string, inject: boolean) {
    const writeStream = fs.createWriteStream(destPath);
    if (inject && srcPath.match(/\.(html|php)$/)) {
        const content = await injectReloadScript(srcPath);
        writeStream.write(content);
    } else {
        const readStream = fs.createReadStream(srcPath);
        await new Promise<void>((resolve, reject) => {
            readStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);
            readStream.pipe(writeStream);
        });
    }
}

async function injectReloadScript(filePath: string): Promise<string> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const $ = cheerio.load(content);
    const phpScriptRegex = /<\?php[\s\S]*?\?>\s*$/m;
    if (phpScriptRegex.test(content)) {
        $('body').append('<script src="/live-reload.min.js"></script>');
    }
    return $.html();
}

async function areFilesIdentical(file1: string, file2: string) {
    if (!fs.existsSync(file1) || !fs.existsSync(file2))
        return false;
    const stat1 = await fs.promises.stat(file1);
    const stat2 = await fs.promises.stat(file2);
    return stat1.size === stat2.size && stat1.mtime.getTime() === stat2.mtime.getTime();
}

function getAppDataPath() {
    switch (os.platform()) {
        case 'win32':
            return path.join(os.homedir(), 'AppData', 'Roaming');
        case 'darwin':
            return path.join(os.homedir(), 'Library', 'Application Support');
        case 'linux':
            return path.join(os.homedir(), '.config');
        default:
            throw new Error('Unsupported platform');
    }
}

export async function updateFile(file: string, workspace: string) {
    let relative = path.relative(workspace, file)
    let cache = getWorkspaceCacheDirectory(workspace);
    await copyFile(file, path.join(cache, relative))
}

export function getWorkspaceCacheDirectory(workspace: string) {
    return path.join(cacheLocation, path.basename(workspace));
}