import * as vscode from 'vscode';
import { status } from './server/status'
import { create as createStatusbar, update as updateStatusbar } from './vscode/statusbar';
import { register } from './vscode/commands';
export const outputChannel = vscode.window.createOutputChannel("Better Web Server");
import { stop } from './server/server';

export function activate(context: vscode.ExtensionContext) {
	outputChannel.appendLine("Activating Better Web Server");
	register(context);
	createStatusbar();
	updateStatusbar(status.READY);
}


export function deactivate() {
	stop();
}
