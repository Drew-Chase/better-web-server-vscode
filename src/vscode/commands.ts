import * as vscode from 'vscode';
import { start as createServer, stop } from '../server/server';
import { status } from '../server/status'
import { update as updateStatusbar } from './statusbar';
import { running, reload } from '../server/server';
import { updateFile, getWorkspaceCacheDirectory } from '../server/filesystem';

export function register(context: vscode.ExtensionContext) {
    let workspace: string | null = null;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
        updateStatusbar(status.INVALID);
    }
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (running && workspace) {
            updateFile(document.fileName, workspace).then(() => {
                reload()
            })
        }
    }))

    context.subscriptions.push(vscode.commands.registerCommand('better-web-server.start-server', () => {
        if (workspace) {
            createServer(workspace);
        } else {
            vscode.window.showErrorMessage("Unable to create ")
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('better-web-server.stop-server', () => {
        stop()
    }));
}
