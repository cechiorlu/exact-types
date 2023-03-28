#! /usr/bin/env node

import inquirer from 'inquirer';
import path from 'path';
import { readFile } from 'fs/promises';
import { fork } from 'child_process';

let dependencies;
const packageManagerOptions = ['npm', 'yarn', 'pnpm', 'bower'] as const;
export type PackageManager = (typeof packageManagerOptions)[number];
export interface IMessage {
  packageName: string;
  packageVersion: string;
  packageManager: PackageManager;
}

const defaultPackageManager: PackageManager = 'npm';

(async () => {
  const packageData = await readFile('package.json', 'utf-8');
  const packageJSON = await JSON.parse(packageData);
  dependencies = packageJSON?.dependencies;
  const useDefault = process.argv[2] === '-y';

  const { packageManager }: { packageManager: PackageManager } = useDefault
    ? defaultPackageManager
    : await inquirer.prompt([
        {
          type: 'list',
          message: 'Pick your package manager:',
          name: 'packageManager',
          choices: packageManagerOptions,
        },
      ]);

  for (let dependency in dependencies) {
    if(!dependency.includes('@')){
      let packageVersion: string = dependencies[dependency].replace('~', '').replace('^', '');
      const forked = fork(path.resolve(__dirname, './scripts.js'));
      forked.send({ packageName: dependency, packageVersion, packageManager });
    }
  }
})();
