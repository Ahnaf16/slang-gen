import * as fs from "fs/promises";
import * as vscode from "vscode";
import * as yaml from "yaml";
import {logToOut} from "../extension";
import * as path from "path";

export function tryGetWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
}

export function getWorkspaceRoot(): string {
  const root = tryGetWorkspaceRoot();
  if (!root) {
    throw new Error("No workspace folder is open.");
  }
  return root;
}

export async function hasPubspec(): Promise<{
  exists: boolean;
  pubPath: string;
}> {
  const workspaceRoot = getWorkspaceRoot();
  const pubPath = path.join(workspaceRoot, "pubspec.yaml");

  try {
    await fs.access(pubPath);
    return {exists: true, pubPath};
  } catch {
    return {exists: false, pubPath};
  }
}

export async function hasDependency(
  pubPath: string,
  dependency: string,
  isDev: boolean = false,
): Promise<boolean> {
  try {
    const pubContent = await fs.readFile(pubPath, "utf8");

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

export async function checkForSlangPackage(): Promise<boolean> {
  const {exists, pubPath} = await hasPubspec();

  if (!exists) {
    showError("pubspec.yaml file not found.");
    return false;
  }
  const hasSlang = await hasDependency(pubPath, "slang");
  if (hasSlang) {
    return true;
  } else {
    showError("Slang package is not found in dependencies.");
    return false;
  }
}

export async function slangConfig(): Promise<SlangConfig> {
  const slangUri = path.join(getWorkspaceRoot(), "slang.yaml");

  try {
    const content = await readOrCreateFile(slangUri, defaultContent);
    const parsed = yaml.parse(content);
    return {
      translate_var: parsed.translate_var,
      class_name: parsed.class_name,
      string_interpolation: parsed.string_interpolation,
      input: parsed.input_directory,
      input_pattern: parsed.input_file_pattern,
    };
  } catch (err) {
    logToOut(`Failed to read slang.yaml:\n${err}`);
    return yaml.parse(defaultContent);
  }
}

export async function readOrCreateFile(
  filePath: string,
  defaultContent: string,
): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      logToOut(`Creating file: ${filePath}`);
      await createFile(filePath, defaultContent);
      return defaultContent;
    } else {
      logToOut(`Error reading file: ${filePath}.\n${err}`);
      throw err;
    }
  }
}

export async function createFile(filePath: string, content: string) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, {recursive: true});
    await fs.writeFile(filePath, content, "utf8");
  } catch (err) {
    logToOut(`Error creating file: ${filePath}.\n${err}`);
    throw err;
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

export interface SlangConfig {
  translate_var: string;
  class_name: string;
  string_interpolation: string;
  input: string;
  input_pattern: string;
}

const defaultContent = `base_locale: en
fallback_strategy: base_locale
input_directory: lib/_core/i18n
input_file_pattern: .i18n.json
output_directory: lib/_core/i18n
output_file_name: translations.dart
translate_var: t
enum_name: AppLocale
class_name: Tr
string_interpolation: dart
format:
  enabled: true
  width: 120
`;
