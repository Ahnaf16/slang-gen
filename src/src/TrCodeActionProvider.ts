import * as vscode from "vscode";
import {ACTION_TITLE, ExtractCommand} from "../extension";
import {extractStringAtRange, checkForSlangPackage} from "./utils";

export class TrCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CodeAction[] | undefined> {
    if (!extractStringAtRange(document, range)) {
      return;
    }

    const hasSlang = await checkForSlangPackage();
    if (!hasSlang) {
      return;
    }

    const action = new vscode.CodeAction(
      ACTION_TITLE,
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      title: ACTION_TITLE,
      command: ExtractCommand,
      arguments: [document, range],
    };

    return [action];
  }
}
