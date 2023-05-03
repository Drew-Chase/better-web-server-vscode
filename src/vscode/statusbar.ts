import { status } from '../server/status';
import { window, StatusBarAlignment, StatusBarItem } from 'vscode';
import { outputChannel } from '../extension'
var statusBarItem: StatusBarItem | null = null;
export function create() {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
    outputChannel.appendLine("creating status bar");
}
export function update(newStatus: status, extra: string | undefined = undefined) {
    if (!statusBarItem)
        return;
    statusBarItem.command = undefined;

    statusBarItem.show();
    statusBarItem.tooltip = "Better Web Server"
    switch (newStatus) {
        case status.READY:
            statusBarItem.text = `$(play-circle) Go Live`
            statusBarItem.tooltip = "Better Web Server: Start server"
            statusBarItem.command = "better-web-server.start-server"
            break;
        case status.INVALID:
            statusBarItem.hide();
            break;
        case status.LOADING:
            statusBarItem.text = "$(sync-spin) Loading..."
            statusBarItem.tooltip = "Better Web Server: Loading..."
            break;
        case status.RUNNING:
            statusBarItem.text = `$(zap) ${extra}!`
            statusBarItem.tooltip = "Better Web Server is running"
            statusBarItem.command = "better-web-server.stop-server"
            break;
    }
}
