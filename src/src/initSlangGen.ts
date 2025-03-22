import * as vscode from "vscode";
import * as fs from "fs";
import * as utils from "./utils";
import {camelCase} from "text-case";
import {exec} from "child_process";
import {logToOut} from "../extension";

export function initSlangGen() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    utils.showError("No workspace folder found.");
    return;
  }

  const {exists, pubPath} = utils.hasPubspec();

  if (!exists) {
    utils.showError("pubspec.yaml file not found.");
    return false;
  }

  let dependencies = [];

  if (!utils.hasDependency(pubPath, "slang")) {
    dependencies.push("slang");
  }
  if (!utils.hasDependency(pubPath, "slang_flutter")) {
    dependencies.push("slang_flutter");
  }
  if (!utils.hasDependency(pubPath, "slang_build_runner", true)) {
    dependencies.push("dev:slang_build_runner");
  }

  if (dependencies.length > 0) {
    addDependency(dependencies);
  }
}

function addDependency(dependency: string[]) {
  logToOut(`Adding dependency: ${dependency}`);

  const cmd = `dart pub add ${dependency.join(" ")}`;
  exec(cmd, (error, stdout) => {
    if (error) {
      logToOut(`Error adding dependency: ${error}`);
      return;
    }

    logToOut(stdout);

    logToOut(`Added dependency: ${dependency}`);
  });
}
