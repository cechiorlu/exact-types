#! /usr/bin/env node

import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { fork } from 'child_process';

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
  const hasDevDependencies = !!(devDependencies && Object.keys(devDependencies).length);

  if (!hasDevDependencies) {
    packageJSON['devDependencies'] = {};
  }

  await writeFile('package.json', packageJSON, 'utf-8');

  for (let dependency in dependencies) {
    if (!dependency.includes('@')) {
      let packageVersion: string = dependencies[dependency].replace('~', '').replace('^', '');
      const forked = fork(path.resolve(__dirname, './scripts.js'));
      forked.send({ packageName: dependency, packageVersion });
      forked.on('message', async ({ typesPackage, typesVersion }: { typesPackage: string; typesVersion: string }) => {
        console.log(`- ${typesPackage}:${typesVersion} successfully added`)
      });
    }
  }
})();
