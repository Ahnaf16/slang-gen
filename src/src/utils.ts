import {readFileSync, existsSync} from "fs";
import * as vscode from "vscode";
import * as yaml from "yaml";
import {logToOut} from "../extension";

export function hasPubspec(): {
  exists: boolean;
  pubPath: string;
} {
  const path =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath + "/pubspec.yaml";
  const exist = existsSync(path);
  return {exists: exist, pubPath: path};
}

export function hasDependency(
  pubPath: string,
  dependency: string,
  isDev: boolean = false,
): boolean {
  try {
    const pubContent = readFileSync(pubPath, "utf8");

    const parsedYaml = yaml.parse(pubContent);

    const dependencies =
      (isDev ? parsedYaml.dev_dependencies : parsedYaml.dependencies) || {};

    if (dependencies[dependency]) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logToOut(`Error reading or parsing pubspec.yaml:\n${error}`);
    return false;
  }
}

export function checkForSlangPackage(): boolean {
  const {exists, pubPath} = hasPubspec();

  if (!exists) {
    showError("pubspec.yaml file not found.");
    return false;
  }
  const hasSlang = hasDependency(pubPath, "slang");
  if (hasSlang) {
    return true;
  } else {
    showError("Slang package is not found in dependencies.");
    return false;
  }
}

export async function slangConfig(): Promise<{
  translate_var: string;
  class_name: string;
  string_interpolation: string;
} | null> {
  const files = await findFiles("**/slang.yaml", 1);
  if (files.length === 0) {
    return null;
  }

  const slangUri = files[0];
  try {
    const content = readFileSync(slangUri.fsPath, "utf8");
    const parsed = yaml.parse(content);
    return {
      translate_var: parsed.translate_var,
      class_name: parsed.class_name,
      string_interpolation: parsed.string_interpolation,
    };
  } catch (err) {
    console.error("Failed to read slang.yaml:", err);
    return null;
  }
}

export function showToast(str: string, isWarning = false) {
  if (isWarning) {
    vscode.window.showWarningMessage(str);
  } else {
    vscode.window.showInformationMessage(str);
  }
}
export function showError(str: string) {
  vscode.window.showErrorMessage(str);
}

export async function findFiles(
  pattern: string,
  maxResults?: number,
): Promise<vscode.Uri[]> {
  const fileUrls = await vscode.workspace.findFiles(
    pattern,
    "**/build/**",
    maxResults,
  );

  return fileUrls;
}

export function extractStringAtRange(
  document: vscode.TextDocument,
  range: vscode.Range,
):
  | {
      fullMatch: string;
      innerText: string;
      start: number;
      end: number;
    }
  | undefined {
  const lineText = document.lineAt(range.start.line).text;
  const stringRegex = /(['"`])((?:\\\1|.)*?)\1/g;

  let match: RegExpExecArray | null;
  while ((match = stringRegex.exec(lineText))) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    if (
      range.start.character >= matchStart &&
      range.start.character <= matchEnd
    ) {
      return {
        fullMatch: match[0],
        innerText: match[2],
        start: matchStart,
        end: matchEnd,
      };
    }
  }

  return undefined;
}
