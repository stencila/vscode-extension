import { Block, BlockType, ForBlock, Node } from "@stencila/types";
import { readFileSync } from "fs";
import path from "path";
import { Position } from "vscode-languageclient";

// Read in `nodes.smd` and determine positions for each node
//const smd = readFileSync(path.join(__dirname, "nodes.smd"), "utf-8").split(
//  "\n"
//);

export function getBlock(position: Position): Block | undefined {
  return {
    type: "ForBlock",
    variable: 'variable',
    code: 'code',
    content: []
  };
}
