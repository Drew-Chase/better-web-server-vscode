import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { window } from "vscode";
import { outputChannel } from "../extension";
import open from 'open';
import { status } from './status'
import { update } from '../vscode/statusbar'
import { copyWorkspace, getWorkspaceCacheDirectory } from "./filesystem";
import axios from 'axios';

let currentServer: ChildProcessWithoutNullStreams | undefined;
export let running: boolean = false;
let url: string;

/**
 * Starts the web server.
 * @param php_path The path to the PHP executable.
 * @param port The port number to listen on.
 * @param working_directory The working directory of the PHP process.
 */
export async function start(php_path: string, port: number, working_directory: string) {
    if (running) {
        window.showErrorMessage(`Server is already running`);
        return;
    }

    update(status.LOADING);

    try {
        await copyWorkspace(working_directory);
        url = `http://127.0.0.1:${port}`;

        // Spawn a PHP process to start the server.
        currentServer = spawn(php_path, ['-S', `127.0.0.1:${port}`, '-t', getWorkspaceCacheDirectory(working_directory)], { cwd: getWorkspaceCacheDirectory(working_directory) });
        running = true;

        // Show a message and open the server URL in the default browser.
        window.showInformationMessage(`Started Web Server`, `View`).then(selection => {
            if (selection === "View") {
                open(url);
            }
        });

        // Log server output to the output channel.
        currentServer.stdout.on("data", data => {
            outputChannel.appendLine(data.toString());
        });

        currentServer.stderr.on("data", error => {
            outputChannel.appendLine(error.toString());
        });

        // Handle server shutdown.
        currentServer.addListener('close', () => {
            outputChannel.appendLine(`Server shutdown`);
            window.showInformationMessage(`Server Stopped!`);
            update(status.READY);
            running = false;
        });

        // Update the status bar to show that the server is running.
        update(status.RUNNING, url);
        navigate(url, false);
    } catch (error) {
        window.showErrorMessage(`Failed to start server: ${error}`);
        update(status.READY);
    }
}

/**
 * Stops the web server.
 */
export function stop() {
    if (!running) {
        window.showErrorMessage(`No server was running`);
        return;
    }

    if (currentServer) {
        if (!currentServer.kill()) {
            window.showErrorMessage(`Failed to kill server`);
        }
    }

    running = false;
}

/**
 * Navigates to a new URL on the web server.
 * @param newUrl The URL to navigate to.
 * @param reload Whether to reload the page.
 */
export async function navigate(newUrl: string | null, reload: boolean): Promise<void> {
    if (!running)
        return;
    if (!newUrl)
        newUrl = url;
    try {
        // Make an HTTP POST request to the server to navigate to the new URL.
        await axios.post(`${url}/injects/live-reload.php`, {
            url: newUrl,
            reload: reload
        });
    } catch (error) {
        console.error(error);
    }
}
