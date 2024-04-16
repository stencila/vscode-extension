import * as path from "path";

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  // Register command to execute the active document
  context.subscriptions.push(
    vscode.commands.registerCommand("stencila.invokeExecuteDocument", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      vscode.commands.executeCommand(
        "stencila.executeDocument",
        editor.document.uri.path
      );

      // TODO: Provide cancellation buttons and notify of completion
      vscode.window.showInformationMessage("Document is executing");
    })
  );

  // Register command to execute the selected node
  context.subscriptions.push(
    vscode.commands.registerCommand("stencila.invokeExecuteNode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      vscode.commands.executeCommand(
        "stencila.executeNode",
        editor.document.uri.path,
        editor.selection.active
      );
    })
  );

  // Start the language server client
  const serverModule = context.asAbsolutePath(path.join("out", "server.js"));
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "smd" }],
    markdown: {
      isTrusted: true,
      supportHtml: true,
    },
  };
  client = new LanguageClient(
    "stencila",
    "Stencila",
    serverOptions,
    clientOptions
  );
  client.start();
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
