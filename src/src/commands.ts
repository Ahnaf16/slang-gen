import {exec} from "child_process";
import {logToOut} from "../extension";
import * as utils from "./utils";
import {promisify} from "util";

const execAsync = promisify(exec);

export async function runSlangGen(
  onSuccess: (r: String) => void = () => {},
  onError: (error: Error) => void = () => {},
) {
  await runCommand("dart run slang", onSuccess, onError);
}

export async function addDependencies(dependency: string[]) {
  logToOut(`Adding dependency: ${dependency}`);

  const cmd = `dart pub add ${dependency.join(" ")}`;
  await runCommand(
    cmd,
    (_) => {
      logToOut(`Added dependencies: ${dependency}`);
    },
    (_) => {
      logToOut(`Error adding dependency`);
      utils.showError(`Error adding dependency`);
    },
  );
}

async function runCommand(
  cmd: string,
  onSuccess: (r: String) => void,
  onError: (error: Error) => void,
) {
  const cwd = utils.getWorkspaceRoot();
  logToOut(`Running command in : ${cwd}`);

  try {
    const {stdout, stderr} = await execAsync(cmd, {cwd});

    if (stderr) {
      logToOut(`⚠️ stderr from "${cmd}":`);
      logToOut(`${stderr}`);
      onError(new Error(stderr));
    }

    logToOut(stdout);
    onSuccess(stdout);
  } catch (error: any) {
    logToOut(`❌ Failed to run "${cmd}"`);
    logToOut(error.message);
    onError(error);
  }
}
