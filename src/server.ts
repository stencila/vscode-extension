/**
 * A module to run the Stencila language server from within Node.js
 *
 * Rather than bundling the Stencila CLI binary with this VSCode extension
 * and spawning `stencila lsp` this script calls Stencila LSP functions
 * exposed by the `@stencila/node` bindings. This has two main advantages:
 *
 * - distributing `@stencila/node` is easier than distributing `stencila` binaries
 *
 * - we can prototype interactions between VSCode and the Stencila language server
 *   i.e. event handlers in this module act as mocks for what the Rust-based
 *   language server function will implement
 */

import { createConnection } from "vscode-languageserver/node";

// Custom logging functions for better visibility in server outputs
const debug = (...args: any[]) => process.stderr.write(`DEBUG ${JSON.stringify(args)}`);
const info = (...args: any[]) => process.stderr.write(`INFO ${JSON.stringify(args)}`);
const warning = (...args: any[]) => process.stderr.write(`WARN ${JSON.stringify(args)}`);
const error = (...args: any[]) => process.stderr.write(`ERROR ${JSON.stringify(args)}`);

// Create a connection for the server, using Node's IPC as a transport.
const connection = createConnection();

// Listen on the connection
info("Listening on LSP connection");
connection.listen();
