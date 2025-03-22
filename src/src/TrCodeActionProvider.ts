import * as vscode from "vscode";
import {ACTION_TITLE, ExtractCommand_Id} from "../extension";
import {extractStringAtRange, usesSlangPackage} from "./utils";

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

    const hasSlang = usesSlangPackage();
    if (!hasSlang) {
      return;
    }

    const action = new vscode.CodeAction(
      ACTION_TITLE,
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      title: ACTION_TITLE,
      command: ExtractCommand_Id,
      arguments: [document, range],
    };

    return [action];
  }
}
