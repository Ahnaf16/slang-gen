import * as vscode from "vscode";
import * as fs from "fs";
import * as utils from "./utils";
import {camelCase} from "text-case";
import {exec} from "child_process";
import {logToOut} from "../extension";

export async function handleExtractToTrCommand(
  document: vscode.TextDocument,
  range: vscode.Range,
) {
  const hasSlang = utils.usesSlangPackage();

  if (!hasSlang) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    utils.showError("No workspace folder found.");
    return;
  }

  const exConfig = vscode.workspace.getConfiguration("slangGen");
  const config = await utils.slangConfig();

  const useContext = exConfig.get("useContext");
  const translateVar = config?.translate_var ?? "t";
  const className = config?.class_name ?? "Translation";

  const stringInfo = utils.extractStringAtRange(document, range);

  if (!stringInfo) {
    utils.showToast("No valid string found.", true);
    return;
  }

  const {innerText, start, end} = stringInfo;

  const userInput = await vscode.window.showInputBox({
    prompt: "Enter translation key (camelCase)",
    value: extractKey(innerText),
    ignoreFocusOut: true,
  });

  if (!userInput) {
    return;
  }

  const {trKey, trValue, replacement} = getTrKeyValue(innerText, userInput);

  const edit = new vscode.WorkspaceEdit();
  var replaced = `${translateVar}.${replacement}`;

  if (useContext) {
    replaced = `${className}.of(context).${replacement}`;
  }

  const startPos = new vscode.Position(range.start.line, start);
  const endPos = new vscode.Position(range.start.line, end);

  edit.replace(document.uri, new vscode.Range(startPos, endPos), replaced);
  await vscode.workspace.applyEdit(edit);

  const cwd = workspaceFolder.uri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Added translation key to localization files.",
      cancellable: false,
    },
    async (p) => {
      return new Promise<void>(async (resolve, reject) => {
        const trFiles = await utils.findFiles("**/i18n/*.i18n.json");

        if (trFiles.length === 0) {
          const msg =
            "No i18n.json file found.\nRun 'slangGen.init' to initialize.";
          logToOut(msg);
          p.report({message: msg});
          return;
        }

        for (const trFile of trFiles) {
          const content = JSON.parse(fs.readFileSync(trFile.fsPath, "utf8"));
          content[trKey] = trValue;
          fs.writeFileSync(trFile.fsPath, JSON.stringify(content, null, 2));
          logToOut(`Added ${userInput} to ${trFile.fsPath}`);
        }

        p.report({message: "Generating localization files..."});

        exec("dart run slang", {cwd}, (error, stdout, stderr) => {
          if (error) {
            p.report({message: "Failed to generate localization files."});
            logToOut(error.message);
            logToOut(error.stack ?? "");
            reject(error);
            return;
          }

          if (stderr) {
            p.report({message: "Failed to generate localization files."});
            logToOut(stderr);
            reject(new Error(stderr));
            return;
          }

          p.report({message: "Localization files generated successfully."});
          logToOut(stdout);
          resolve();
        });
      });
    },
  );
}

function getTrKeyValue(
  str: string,
  userKey: string,
): {
  trKey: string;
  trValue: string;
  replacement: string;
} {
  const regex = /\$(\w+)|\$\{([^}]+)\}/g;

  const variables: string[] = [];
  let text = str;

  text = text.replace(regex, (_, g1, g2) => {
    const name = g1 || g2;
    if (name) {
      variables.push(name.trim());
    }
    return "";
  });

  const baseKey = userKey;

  const trValues = str.replace(regex, (match, g1, g2) => {
    if (g1) {
      return `$${g1}`;
    } else if (g2) {
      return `$${extractMethodName(g2)}`;
    }
    return match;
  });

  if (variables.length === 0) {
    return {
      trKey: baseKey,
      trValue: trValues,
      replacement: baseKey,
    };
  }

  const namedArgs = variables
    .map((v) => `${extractMethodName(v)}:${v}`)
    .join(", ");

  const replacement = `${baseKey}(${namedArgs})`;

  return {
    trKey: baseKey,
    trValue: trValues,
    replacement: replacement,
  };
}

function extractMethodName(str: string): string {
  const lastSegment = str
    .replace(/\)?$/, "")
    .split(/\.|\(/)
    .filter(Boolean)
    .pop();

  return lastSegment || str;
}

function extractKey(text: string): string {
  const regex = /\$(\w+)|\$\{([^}]+)\}/g;
  text = text.replace(regex, () => "");

  const cleanedText = text.replace(/\s+/g, " ").trim();

  return camelCase(cleanedText);
}
