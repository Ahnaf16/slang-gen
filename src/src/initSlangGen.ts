import * as utils from "./utils";
import {logToOut, clearOutput} from "../extension";
import * as cmd from "./commands";
import {join} from "path";

export async function initSlangGen() {
  clearOutput();
  const root = utils.tryGetWorkspaceRoot();

  if (!root) {
    logToOut("No workspace folder is open.");
    return false;
  }

  const {exists, pubPath} = await utils.hasPubspec();

  if (!exists) {
    utils.showError("pubspec.yaml file not found.");
    return false;
  }

  let dependencies = [];

  if (!(await utils.hasDependency(pubPath, "slang"))) {
    dependencies.push("slang");
  }
  if (!(await utils.hasDependency(pubPath, "slang_flutter"))) {
    dependencies.push("slang_flutter");
  }
  if (!(await utils.hasDependency(pubPath, "slang_build_runner", true))) {
    dependencies.push("dev:slang_build_runner");
  }
  logToOut(`dependencies to add: ${dependencies}`);
  if (dependencies.length > 0) {
    await cmd.addDependencies(dependencies);
  }

  const config = await utils.slangConfig();

  const inputPath = join(root, config.input, `str_en${config.input_pattern}`);
  await utils.createFile(inputPath, "{}");
  await cmd.runSlangGen();
}
