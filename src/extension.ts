import * as vscode from "vscode";
import {handleExtractToTrCommand} from "./src/handleExtractToTrCommand";
import {TrCodeActionProvider} from "./src/TrCodeActionProvider";
import {initSlangGen} from "./src/initSlangGen";

export const InitCommand_Id = "extension.init";
export const ExtractCommand_Id = "extension.extractToTr";
export const ACTION_TITLE = "Extract to Tr";
const SUPPORTED_LANGUAGE = "dart";

let outPut: vscode.OutputChannel;

export function logToOut(str: string) {
  outPut.appendLine(str);
}

export function activate(context: vscode.ExtensionContext) {
  outPut = vscode.window.createOutputChannel("Slang Gen");

  outPut.appendLine("Slang Gen Extension activated.");

  context.subscriptions.push(
    vscode.commands.registerCommand(InitCommand_Id, initSlangGen),
    vscode.commands.registerCommand(
      ExtractCommand_Id,
      handleExtractToTrCommand,
    ),

    vscode.languages.registerCodeActionsProvider(
      {scheme: "file", language: SUPPORTED_LANGUAGE},
      new TrCodeActionProvider(),
      {providedCodeActionKinds: TrCodeActionProvider.providedCodeActionKinds},
    ),
  );
}

export function deactivate() {}
