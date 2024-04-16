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

import { ExecutionStatus } from "@stencila/types";
import { InitializeResult, createConnection } from "vscode-languageserver/node";
import { configure } from "nunjucks";
import { readFileSync } from "fs";
import * as path from "path";

// The root dir of this repo
const rootDir = path.join(__dirname, "..");

const camelToKebab = (str: string) =>
  str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

// Point Nunjucks to the templates folder
const env = configure(path.join(rootDir, "templates"));

// Get the emoji for a node
env.addGlobal("execution_status_emoji", (status: ExecutionStatus) => {
  return (
    {
      Succeeded: "🟢",
      Errors: "🟥",
      Exceptions: "🟥",
      Cancelled: "🔶",
    }[status] ?? "🔵"
  );
});

// Get the icon for a node
env.addGlobal("node_icon", (type: string) => {
  try {
    const base64 = readFileSync(
      path.join(rootDir, "icons", "nodes", `${camelToKebab(type)}.svg`),
      "base64"
    );
    return `![](data:image/svg+xml;base64,${base64})`;
  } catch {
    return undefined;
  }
});

// Represent a node as JSON
env.addGlobal("to_json", (object: any) => JSON.stringify(object));

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
 * This should return Markdown content related to the node at the `position`.
 */
connection.onHover(({ textDocument, position }) => {
  // Read the line
  const line = readFileSync(textDocument.uri.replace("file://", ""), "utf-8")
    .split("\n")
    [position.line].trim();

  // Guess the type of node based on the content of the line
  let template = "default";
  let fixture;
  if (line.startsWith("```") && line.endsWith("exec")) {
    template = "code-chunk";
    fixture = "code-chunk";
    if (line.startsWith("```py")) {
      fixture += ".with-exception";
    }
  } else if (line.startsWith("```")) {
    fixture = "code-block";
  } else if (line.startsWith("::: for")) {
    template = "for-block";
    fixture = "for-block";
  } else if (position.line > 10) {
    fixture = "paragraph.with-authors";
  } else {
    fixture = "paragraph";
  }

  // If no fixture, don't return a hover
  if (fixture === undefined) {
    return undefined;
  }

  // Read the corresponding node from fixtures
  const node = JSON.parse(
    readFileSync(
      path.join(rootDir, "fixtures", "nodes", `${fixture}.json`),
      "utf-8"
    )
  );

  // Render the Markdown template for the node
  const md = env.render(`hover/${template}.jinja`, node);
  //debug(md);

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
