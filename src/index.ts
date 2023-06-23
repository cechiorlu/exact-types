#! /usr/bin/env node

import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { fork } from 'child_process';
// import inquirer from 'inquirer';

// const packageManagerOptions = ['npm', 'yarn', 'pnpm', 'bower'] as const;
// type PackageManager = (typeof packageManagerOptions)[number];

// const defaultPackageManager = 'npm';

let dependencies, devDependencies;
export interface IMessage {
  packageName: string;
  packageVersion: string;
}

(async () => {
  const packageData = await readFile('package.json', 'utf-8');
  const packageJSON = await JSON.parse(packageData);
  dependencies = packageJSON?.dependencies;
  devDependencies = packageJSON?.devDependencies;

  // const useDefault = process.argv[2] === '-y';
  // const { packageManager }: { packageManager: PackageManager } = useDefault
  //   ? defaultPackageManager
  //   : await inquirer.prompt([
  //       {
  //         type: 'list',
  //         message: 'Pick your package manager:',
  //         name: 'packageManager',
  //         choices: packageManagerOptions,
  //       },
  //     ]);

  const hasDevDependencies = !!(devDependencies && Object.keys(devDependencies).length);

  if (!hasDevDependencies) {
    packageJSON['devDependencies'] = {};
    let packageData = JSON.stringify(packageJSON);
    await writeFile('package.json', packageData, 'utf-8');
  }

  for (let dependency in dependencies) {
    if (!dependency.includes('@')) {
      let packageVersion: string = dependencies[dependency].replace('~', '').replace('^', '');
      const forked = fork(path.resolve(__dirname, './scripts.js'));
      forked.send({ packageName: dependency, packageVersion });
      forked.on('message', async ({ typesPackage, typesVersion }: { typesPackage: string; typesVersion: string }) => {
        console.log(`- ${typesPackage}:${typesVersion} successfully added`);
      });
    }
  }

  // let command = 'install';
  // if (packageManager === 'yarn') {
  //   command = 'add';
  // }

  // const install = spawn(packageManager, [command]);

  // install.stdout.on('data', (data) => {
  //   console.log(`stdout: ${data}`);
  // });

  // install.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  // });

  // install.on('close', (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });

})();
