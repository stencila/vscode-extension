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

import { InitializeResult, createConnection } from "vscode-languageserver/node";

import { getBlock } from "./fixtures/nodes";

// Custom logging functions for better visibility in server outputs
const debug = (...args: any[]) =>
  process.stderr.write(`DEBUG ${JSON.stringify(args)}\n`);
const info = (...args: any[]) =>
  process.stderr.write(`INFO ${JSON.stringify(args)}\n`);
const warning = (...args: any[]) =>
  process.stderr.write(`WARN ${JSON.stringify(args)}\n`);
const error = (...args: any[]) =>
  process.stderr.write(`ERROR ${JSON.stringify(args)}\n`);

// Create a connection for the server, using Node's IPC as a transport.
const connection = createConnection();

/**
 * Handle the `initialize` request with capabilities etc
 */
connection.onInitialize((params): InitializeResult => {
  return {
    capabilities: {
      hoverProvider: true,
    },
  };
});

/**
 * Handle a hover request
 *
 * This should return Markdown content for the hover card.
 */
connection.onHover(({ textDocument, position }) => {
  const node = getBlock(position);
  if (!node) {
    return undefined;
  }

  const md = `
## ${node.type}

***

All basic markdown is supported including lists and tables

We can also include images as dataURis which allows for icons etc.

![Status](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJyZWQiIC8+Cjwvc3ZnPg== "Image Title")

The main constraint seems to be vertical height of hover to avoid need for scrolling.

***

\`${textDocument.uri}:${position.line}:${position.character}\`
`;

  return {
    contents: {
      kind: "markdown",
      value: md,
    },
  };
});

// Listen on the connection
info("Listening on LSP connection");
connection.listen();
