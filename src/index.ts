#!/usr/bin/env node
import inquirer from "inquirer";
import path from "path";
import { readFile } from "fs/promises";
import { fork } from "child_process";

let dependencies;
const packageManagerOptions = ['npm', 'yarn', 'pnpm', 'bit', 'turbo'] as const;
type PackageManager = typeof packageManagerOptions[number];

const defaultPackageManager: PackageManager = "npm";

(async () => {
  const packageData = await readFile("package.json", "utf-8");
  const packageJSON = await JSON.parse(packageData);
  dependencies = packageJSON?.dependencies;
  const useDefault = process.argv[2] === "-y";

  const { packageManager } = useDefault ? defaultPackageManager : await inquirer.prompt([
    {
      type: "list",
      message: "Pick your package manager:",
      name: "packageManager",
      choices: packageManagerOptions,
    }
  ])

  console.log(packageManager)


  for (let dependency in dependencies) {
    let packageVersion: string = dependencies[dependency]
      .replace("~", "")
      .replace("^", "");
    const forked = fork(path.resolve(__dirname, "./getReleaseDate.js"));
    const message = dependency + ":" + packageVersion;
    forked.send({ message });
    forked.on("message", (msg) => {
      console.log(dependency, msg)
    });
  }
})();
